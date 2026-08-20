"use server";

import { z } from "zod";
import { db } from "@/server/db";
import {
  utilityBills,
  billActivityLogs,
  user,
  departments,
} from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "@/server/auth";
import { runAuditChecks } from "@/server/actions/audits";
import { runNotificationEngine } from "@/server/actions/notifications";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

async function saveFile(file: File | null) {
  if (!file || file.size === 0) return null;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  let baseName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  let ext = "";
  const lastDot = baseName.lastIndexOf(".");
  if (lastDot !== -1 && lastDot > 0) {
    ext = baseName.substring(lastDot);
    baseName = baseName.substring(0, lastDot);
  }
  if (baseName.length > 50) baseName = baseName.substring(0, 50);

  const filename = `${crypto.randomUUID()}-${baseName}${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

async function generateBillPrefix(data: {
  billingYear: number;
  billingMonth: number;
  utilityType: string;
  departmentId: string;
  disbursingType?: string;
  depositUnitId?: string;
}) {
  const thaiYear = (data.billingYear + 543).toString().slice(-2);
  const paddedMonth = data.billingMonth.toString().padStart(2, "0");

  let accountLastDigit = "9"; // Default fallback
  switch (data.utilityType) {
    case "ค่าไฟฟ้า":
      accountLastDigit = "1";
      break;
    case "ค่าประปา&น้ำบาดาล":
      accountLastDigit = "3";
      break;
    case "ค่าโทรศัพท์":
      accountLastDigit = "5";
      break;
    case "ค่าสื่อสาร&โทรคมนาคม":
      accountLastDigit = "6";
      break;
    case "ค่าบริการไปรษณีย์":
      accountLastDigit = "7";
      break;
  }

  let relevantDepartmentId = data.departmentId;
  if (data.disbursingType === "หน่วยงานฝากเบิก" && data.depositUnitId) {
    relevantDepartmentId = data.depositUnitId;
  }

  const dept = await db.query.departments.findFirst({
    where: (departments, { eq }) => eq(departments.id, relevantDepartmentId),
  });
  const costCenter = dept?.costCenterCode || "000";
  const costCenterLast3 = costCenter.slice(-3).padStart(3, "0");

  return `${thaiYear}${paddedMonth}-${costCenterLast3}-${accountLastDigit}-`;
}

async function generateBillCode(prefix: string): Promise<string> {
  const latestBill = await db.query.utilityBills.findFirst({
    where: (bills, { like }) => like(bills.billCode, `${prefix}%`),
    orderBy: (bills, { desc }) => [desc(bills.billCode)],
  });

  let nextSequence = 1;
  if (latestBill && latestBill.billCode) {
    const currentSeqStr = latestBill.billCode.slice(prefix.length);
    const currentSeq = parseInt(currentSeqStr, 10);
    if (!isNaN(currentSeq)) {
      nextSequence = currentSeq + 1;
    }
  }

  return `${prefix}${nextSequence.toString().padStart(3, "0")}`;
}

const createBillSchema = z
  .object({
    departmentId: z.string().min(1, "กรุณาเลือกหน่วยงาน"),
    utilityType: z.string().min(1, "กรุณาเลือกประเภทสาธารณูปโภค"),
    billingMonth: z.string().min(1, "กรุณาเลือกเดือนที่ออกบิล"),
    provider: z.string().optional(),
    serviceNumber: z
      .string()
      .min(
        1,
        "กรุณาเลือกหมายเลขผู้ใช้ / รหัสเครื่องวัดอย่างน้อย 1 หมายเลข\n(หากไม่มีหมายเลขที่ต้องการ ให้กดปุ่มจัดการรหัสเครื่องวัด)",
      ),
    serviceBreakdown: z.string().optional(),
    locationType: z.string().optional(),
    amountBaht: z.coerce.number().optional(),
    unitsUsed: z.coerce.number().optional(),
    estimatedAmount: z.coerce.number().optional(),
    documentRef: z.string().optional(),
    invoiceDate: z.string().optional(),
    receivedDate: z.string().optional(),
    invoiceStatus: z.enum(["RECEIVED", "NOT_RECEIVED"]).optional(),
    paymentStatus: z.enum(["PENDING", "PAID"]),
    paymentDate: z.string().optional(),
    receiptPaymentDate: z.string().optional(),
    sentToDisbursingDate: z.string().optional(),
    disbursingReceivedDate: z.string().optional(),
    paymentDocNumber: z.string().optional(),
    costCenterCode: z.string().optional(),
    docType: z.string().optional(),
    accountCode: z.string().optional(),
    budgetCode: z.string().optional(),
    paidAmount: z.coerce.number().optional(),
    disbursingType: z.string().optional(),
    depositUnitId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentStatus === "PAID") {
      if (!data.paymentDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาระบุวันที่เอกสาร",
          path: ["paymentDate"],
        });
      }
      if (
        !data.costCenterCode ||
        data.costCenterCode.trim() === "" ||
        data.costCenterCode === "-"
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "ไม่พบรหัสศูนย์ต้นทุนของหน่วยงานที่เบิกจ่าย (กรุณาตรวจสอบข้อมูลหน่วยงานหรือระบุหน่วยงานฝากเบิก)",
          path: ["costCenterCode"],
        });
      }
    }

    if (data.disbursingType === "หน่วยงานฝากเบิก" && !data.depositUnitId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาระบุหน่วยงานที่รับฝากเบิก",
        path: ["depositUnitId"],
      });
    }

    if (data.invoiceStatus === "RECEIVED") {
      if (!data.invoiceDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาระบุวันที่ใบแจ้งหนี้",
          path: ["invoiceDate"],
        });
      }
      if (!data.receivedDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาระบุวันที่ลงรับใบแจ้งหนี้",
          path: ["receivedDate"],
        });
      }
      if (data.amountBaht === undefined || data.amountBaht < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ยอดเงินต้องมากกว่าหรือเท่ากับ 0",
          path: ["amountBaht"],
        });
      }
    }
  });

const updateBillSchema = createBillSchema.extend({
  billId: z.string().min(1, "ไม่พบรหัสอ้างอิงของบิล"),
});

export async function createBill(prevState: any, formData: FormData) {
  try {
    const session = await requireRole([
      "admin",
      "central_staff",
      "regional_staff",
      "user",
    ]);

    const parsed = createBillSchema.safeParse({
      departmentId: formData.get("departmentId"),
      utilityType: formData.get("utilityType"),
      billingMonth: formData.get("billingMonth"),
      provider: formData.get("provider") || undefined,
      serviceNumber: formData.get("serviceNumber")?.toString() || "",
      serviceBreakdown:
        formData.get("serviceBreakdown")?.toString() || undefined,
      locationType: formData.get("locationType") || undefined,
      amountBaht: formData.get("amountBaht") || undefined,
      estimatedAmount: formData.get("estimatedAmount") || undefined,
      unitsUsed: formData.get("unitsUsed") || undefined,
      documentRef: formData.get("documentRef") || undefined,
      invoiceDate: formData.get("invoiceDate") || undefined,
      receivedDate: formData.get("receivedDate") || undefined,
      invoiceStatus: formData.get("invoiceStatus") || undefined,
      paymentStatus: formData.get("paymentStatus"),
      paymentDate: formData.get("paymentDate") || undefined,
      receiptPaymentDate: formData.get("receiptPaymentDate") || undefined,
      sentToDisbursingDate: formData.get("sentToDisbursingDate") || undefined,
      disbursingReceivedDate:
        formData.get("disbursingReceivedDate") || undefined,
      paymentDocNumber: formData.get("paymentDocNumber") || undefined,
      costCenterCode: formData.get("costCenterCode") || undefined,
      docType: formData.get("docType") || undefined,
      accountCode: formData.get("accountCode") || undefined,
      budgetCode: formData.get("budgetCode") || undefined,
      paidAmount: formData.get("paidAmount") || undefined,
      disbursingType: formData.get("disbursingType") || undefined,
      depositUnitId: formData.get("depositUnit") || undefined,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.flatten().fieldErrors,
      };
    }

    if (
      session.user.role === "user" &&
      parsed.data.departmentId !== session.user.departmentId
    ) {
      return {
        success: false,
        error: "ท่านสามารถบันทึกบิลได้เฉพาะของหน่วยงานตนเองเท่านั้น",
      };
    }

    const invoiceFile = formData.get("attachmentInvoice") as File | null;
    const receiptFile = formData.get("attachmentReceipt") as File | null;
    const directPaymentFile = formData.get(
      "attachmentDirectPayment",
    ) as File | null;
    const ktbReportFile = formData.get("attachmentKtbReport") as File | null;

    const [invoiceUrl, receiptUrl, directPaymentUrl, ktbReportUrl] =
      await Promise.all([
        saveFile(invoiceFile),
        saveFile(receiptFile),
        saveFile(directPaymentFile),
        saveFile(ktbReportFile),
      ]);

    const billingMonthDate = new Date(parsed.data.billingMonth);
    const invoiceDate = parsed.data.invoiceDate
      ? new Date(parsed.data.invoiceDate)
      : null;
    const receivedDate = parsed.data.receivedDate
      ? new Date(parsed.data.receivedDate)
      : null;
    const paymentDate = parsed.data.paymentDate
      ? new Date(parsed.data.paymentDate)
      : null;
    const sentToDisbursingDate = parsed.data.sentToDisbursingDate
      ? new Date(parsed.data.sentToDisbursingDate)
      : null;
    const disbursingReceivedDate = parsed.data.disbursingReceivedDate
      ? new Date(parsed.data.disbursingReceivedDate)
      : null;
    const billId = crypto.randomUUID();

    const month = billingMonthDate.getMonth() + 1;
    const year = billingMonthDate.getFullYear();

    // Check for duplicates
    if (parsed.data.serviceNumber) {
      const existingBills = await db.query.utilityBills.findMany({
        where: (bills, { and, eq }) =>
          and(eq(bills.billingMonth, month), eq(bills.billingYear, year)),
      });

      const newServiceNumbers = parsed.data.serviceNumber
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      for (const bill of existingBills) {
        if (bill.serviceNumber) {
          const existingNumbers = bill.serviceNumber
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          const duplicate = newServiceNumbers.find((num) =>
            existingNumbers.includes(num),
          );
          if (duplicate) {
            return {
              success: false,
              error: `ไม่สามารถบันทึกได้ เนื่องจากหมายเลขผู้ใช้ "${duplicate}" ถูกบันทึกในบิลประจำเดือนนี้ไปแล้ว`,
            };
          }
        }
      }
    }

    const prefix = await generateBillPrefix({
      billingYear: year,
      billingMonth: month,
      utilityType: parsed.data.utilityType,
      departmentId: parsed.data.departmentId,
      disbursingType: parsed.data.disbursingType,
      depositUnitId: parsed.data.depositUnitId,
    });
    const billCode = await generateBillCode(prefix);

    await db.insert(utilityBills).values({
      id: billId,
      billCode: billCode,
      departmentId: parsed.data.departmentId,
      utilityType: parsed.data.utilityType,
      billingMonth: month,
      billingYear: year,
      provider: parsed.data.provider,
      serviceNumber: parsed.data.serviceNumber,
      serviceBreakdown: parsed.data.serviceBreakdown,
      locationType: parsed.data.locationType,
      invoiceAmount: parsed.data.amountBaht?.toString(),
      usageAmount: parsed.data.unitsUsed?.toString(),
      invoiceNumber: parsed.data.documentRef,
      invoiceDate: invoiceDate,
      receivedDate: receivedDate,
      paymentDate: paymentDate,
      receiptPaymentDate: parsed.data.receiptPaymentDate
        ? new Date(parsed.data.receiptPaymentDate)
        : null,
      sentToDisbursingDate: sentToDisbursingDate,
      disbursingReceivedDate: disbursingReceivedDate,
      paymentStatus: parsed.data.paymentStatus,
      invoiceStatus: parsed.data.invoiceStatus || "NOT_RECEIVED",
      paymentDocNumber: parsed.data.paymentDocNumber,
      docType: parsed.data.docType,
      accountCode: parsed.data.accountCode,
      budgetCode: parsed.data.budgetCode,
      paidAmount: parsed.data.paidAmount?.toString(),
      attachmentInvoice: invoiceUrl,
      attachmentReceipt: receiptUrl,
      attachmentDirectPayment: directPaymentUrl,
      attachmentKtbReport: ktbReportUrl,
      isPendingBillOnly: parsed.data.disbursingType === "หน่วยงานฝากเบิก",
      depositUnitId: parsed.data.depositUnitId,
      createdBy: session.user.id,
    });

    if (
      parsed.data.disbursingType === "หน่วยงานฝากเบิก" &&
      parsed.data.depositUnitId
    ) {
      await db
        .update(departments)
        .set({ depositUnit: parsed.data.depositUnitId, updatedAt: new Date() })
        .where(eq(departments.id, parsed.data.departmentId));
    }

    await db.insert(billActivityLogs).values({
      id: crypto.randomUUID(),
      billId: billId,
      userId: session.user.id,
      action: "CREATED",
      details: "สร้างรายการบิลค่าสาธารณูปโภคใหม่",
    });

    // Run automated audit checks in the background
    runAuditChecks(billId, session.user.id).catch(console.error);

    // Evaluate and trigger notifications (e.g. Budget limit)
    runNotificationEngine().catch(console.error);

    revalidatePath("/bills");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล หรือท่านไม่มีสิทธิ์ในการทำรายการนี้",
    };
  }
}

export async function deleteBill(id: string) {
  try {
    const session = await requireRole([
      "admin",
      "central_staff",
      "regional_staff",
      "user",
    ]);

    if (session.user.role === "user") {
      const existingBill = await db.query.utilityBills.findFirst({
        where: eq(utilityBills.id, id),
      });
      if (
        !existingBill ||
        existingBill.departmentId !== session.user.departmentId
      ) {
        return { success: false, error: "ท่านไม่มีสิทธิ์ลบบิลของหน่วยงานอื่น" };
      }
    }

    await db.delete(utilityBills).where(eq(utilityBills.id, id));

    revalidatePath("/bills");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการลบข้อมูล หรือท่านไม่มีสิทธิ์ในการทำรายการนี้",
    };
  }
}

export async function markBillAsReviewed(billId: string, isReviewed: boolean) {
  try {
    const session = await requireRole([
      "admin",
      "auditor",
      "strategy_finance",
      "central_staff",
    ]);

    await db
      .update(utilityBills)
      .set({
        isReviewed,
        reviewedBy: isReviewed ? session.user.id : null,
        reviewedAt: isReviewed ? new Date() : null,
      })
      .where(eq(utilityBills.id, billId));

    await db.insert(billActivityLogs).values({
      id: crypto.randomUUID(),
      billId: billId,
      userId: session.user.id,
      action: "AUDITED",
      details: isReviewed ? "ตรวจสอบรายการบิลเรียบร้อยแล้ว" : "ยกเลิกการตรวจสอบบิล",
    });

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update review status",
    };
  }
}

export async function updateBill(prevState: any, formData: FormData) {
  try {
    const session = await requireRole([
      "admin",
      "central_staff",
      "regional_staff",
      "user",
    ]);

    const parsed = updateBillSchema.safeParse({
      billId: formData.get("billId"),
      departmentId: formData.get("departmentId"),
      utilityType: formData.get("utilityType"),
      billingMonth: formData.get("billingMonth"),
      provider: formData.get("provider") || undefined,
      serviceNumber: formData.get("serviceNumber")?.toString() || "",
      serviceBreakdown:
        formData.get("serviceBreakdown")?.toString() || undefined,
      locationType: formData.get("locationType") || undefined,
      amountBaht: formData.get("amountBaht") || undefined,
      estimatedAmount: formData.get("estimatedAmount") || undefined,
      unitsUsed: formData.get("unitsUsed") || undefined,
      documentRef: formData.get("documentRef") || undefined,
      invoiceDate: formData.get("invoiceDate") || undefined,
      receivedDate: formData.get("receivedDate") || undefined,
      invoiceStatus: formData.get("invoiceStatus") || undefined,
      paymentStatus: formData.get("paymentStatus"),
      paymentDate: formData.get("paymentDate") || undefined,
      receiptPaymentDate: formData.get("receiptPaymentDate") || undefined,
      sentToDisbursingDate: formData.get("sentToDisbursingDate") || undefined,
      disbursingReceivedDate:
        formData.get("disbursingReceivedDate") || undefined,
      paymentDocNumber: formData.get("paymentDocNumber") || undefined,
      costCenterCode: formData.get("costCenterCode") || undefined,
      docType: formData.get("docType") || undefined,
      accountCode: formData.get("accountCode") || undefined,
      budgetCode: formData.get("budgetCode") || undefined,
      paidAmount: formData.get("paidAmount") || undefined,
      disbursingType: formData.get("disbursingType") || undefined,
      depositUnitId: formData.get("depositUnit") || undefined,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.flatten().fieldErrors,
      };
    }

    const existingBill = await db.query.utilityBills.findFirst({
      where: eq(utilityBills.id, parsed.data.billId),
    });

    if (!existingBill) {
      return { success: false, error: "ไม่พบบิลที่ต้องการแก้ไข" };
    }

    if (session.user.role === "user") {
      if (parsed.data.departmentId !== session.user.departmentId) {
        return {
          success: false,
          error: "ท่านสามารถแก้ไขบิลได้เฉพาะของหน่วยงานตนเองเท่านั้น",
        };
      }
      if (existingBill.departmentId !== session.user.departmentId) {
        return { success: false, error: "ท่านไม่มีสิทธิ์แก้ไขบิลของหน่วยงานอื่น" };
      }
    }

    const invoiceFile = formData.get("attachmentInvoice") as File | null;
    const receiptFile = formData.get("attachmentReceipt") as File | null;
    const directPaymentFile = formData.get(
      "attachmentDirectPayment",
    ) as File | null;
    const ktbReportFile = formData.get("attachmentKtbReport") as File | null;

    const [invoiceUrl, receiptUrl, directPaymentUrl, ktbReportUrl] =
      await Promise.all([
        saveFile(invoiceFile),
        saveFile(receiptFile),
        saveFile(directPaymentFile),
        saveFile(ktbReportFile),
      ]);

    const billingMonthDate = new Date(parsed.data.billingMonth);
    const invoiceDate = parsed.data.invoiceDate
      ? new Date(parsed.data.invoiceDate)
      : null;
    const receivedDate = parsed.data.receivedDate
      ? new Date(parsed.data.receivedDate)
      : null;
    const paymentDate = parsed.data.paymentDate
      ? new Date(parsed.data.paymentDate)
      : null;
    const sentToDisbursingDate = parsed.data.sentToDisbursingDate
      ? new Date(parsed.data.sentToDisbursingDate)
      : null;
    const disbursingReceivedDate = parsed.data.disbursingReceivedDate
      ? new Date(parsed.data.disbursingReceivedDate)
      : null;

    const month = billingMonthDate.getMonth() + 1;
    const year = billingMonthDate.getFullYear();

    // Check for duplicates
    if (parsed.data.serviceNumber) {
      const existingBills = await db.query.utilityBills.findMany({
        where: (bills, { and, eq, ne }) =>
          and(
            eq(bills.billingMonth, month),
            eq(bills.billingYear, year),
            ne(bills.id, parsed.data.billId),
          ),
      });

      const newServiceNumbers = parsed.data.serviceNumber
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      for (const bill of existingBills) {
        if (bill.serviceNumber) {
          const existingNumbers = bill.serviceNumber
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          const duplicate = newServiceNumbers.find((num) =>
            existingNumbers.includes(num),
          );
          if (duplicate) {
            return {
              success: false,
              error: `ไม่สามารถบันทึกได้ เนื่องจากหมายเลขผู้ใช้ "${duplicate}" ถูกบันทึกในบิลประจำเดือนนี้ไปแล้ว`,
            };
          }
        }
      }
    }

    const newPrefix = await generateBillPrefix({
      billingYear: year,
      billingMonth: month,
      utilityType: parsed.data.utilityType,
      departmentId: parsed.data.departmentId,
      disbursingType: parsed.data.disbursingType,
      depositUnitId: parsed.data.depositUnitId,
    });

    let newBillCode = existingBill.billCode;
    const currentPrefix = existingBill.billCode
      ? existingBill.billCode.substring(0, 11)
      : "";

    if (!existingBill.billCode || currentPrefix !== newPrefix) {
      newBillCode = await generateBillCode(newPrefix);
    }

    const updateData: any = {
      billCode: newBillCode,
      departmentId: parsed.data.departmentId,
      utilityType: parsed.data.utilityType,
      billingMonth: month,
      billingYear: year,
      provider: parsed.data.provider,
      serviceNumber: parsed.data.serviceNumber,
      serviceBreakdown: parsed.data.serviceBreakdown,
      locationType: parsed.data.locationType,
      invoiceAmount: parsed.data.amountBaht?.toString(),
      usageAmount: parsed.data.unitsUsed?.toString(),
      invoiceNumber: parsed.data.documentRef,
      invoiceDate: invoiceDate,
      receivedDate: receivedDate,
      invoiceStatus: parsed.data.invoiceStatus || "NOT_RECEIVED",
      paymentStatus: parsed.data.paymentStatus,
      paymentDate: paymentDate,
      receiptPaymentDate: parsed.data.receiptPaymentDate
        ? new Date(parsed.data.receiptPaymentDate)
        : null,
      sentToDisbursingDate: sentToDisbursingDate,
      disbursingReceivedDate: disbursingReceivedDate,
      paymentDocNumber: parsed.data.paymentDocNumber,
      docType: parsed.data.docType,
      accountCode: parsed.data.accountCode,
      budgetCode: parsed.data.budgetCode,
      paidAmount: parsed.data.paidAmount?.toString(),
      isPendingBillOnly: parsed.data.disbursingType === "หน่วยงานฝากเบิก",
      depositUnitId: parsed.data.depositUnitId,
      updatedAt: new Date(),
    };

    if (invoiceUrl) updateData.attachmentInvoice = invoiceUrl;
    if (receiptUrl) updateData.attachmentReceipt = receiptUrl;
    if (directPaymentUrl) updateData.attachmentDirectPayment = directPaymentUrl;
    if (ktbReportUrl) updateData.attachmentKtbReport = ktbReportUrl;

    await db
      .update(utilityBills)
      .set(updateData)
      .where(eq(utilityBills.id, parsed.data.billId));

    if (
      parsed.data.disbursingType === "หน่วยงานฝากเบิก" &&
      parsed.data.depositUnitId
    ) {
      await db
        .update(departments)
        .set({ depositUnit: parsed.data.depositUnitId, updatedAt: new Date() })
        .where(eq(departments.id, parsed.data.departmentId));
    }

    await db.insert(billActivityLogs).values({
      id: crypto.randomUUID(),
      billId: parsed.data.billId,
      userId: session.user.id,
      action: "UPDATED",
      details: "แก้ไขข้อมูลบิลทั่วไป",
    });

    // Re-run audit checks after update
    runAuditChecks(parsed.data.billId, session.user.id).catch(console.error);

    revalidatePath("/bills");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล หรือท่านไม่มีสิทธิ์ในการทำรายการนี้",
    };
  }
}

export async function getLatestEstimatedAmount(
  serviceNumber: string,
  currentMonth: string,
) {
  try {
    const session = await requireRole([
      "admin",
      "central_staff",
      "regional_staff",
      "user",
    ]);
    if (!serviceNumber || !currentMonth) return null;

    const date = new Date(`${currentMonth}-01T00:00:00`);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // Find the most recent bill for this service number that is BEFORE the current month and has a non-null invoiceAmount
    const bills = await db.query.utilityBills.findMany({
      where: (bills, { and, eq, or, lt, sql, isNotNull }) =>
        and(
          eq(bills.serviceNumber, serviceNumber),
          isNotNull(bills.invoiceAmount),
          sql`(${bills.billingYear} * 12 + ${bills.billingMonth}) < (${year} * 12 + ${month})`,
        ),
      orderBy: (bills, { desc }) => [
        desc(bills.billingYear),
        desc(bills.billingMonth),
      ],
      limit: 1,
    });

    if (bills.length > 0) {
      return Number(bills[0].invoiceAmount);
    }
    return null;
  } catch (error) {
    console.error("Failed to get latest estimated amount:", error);
    return null;
  }
}

export async function getBillLogs(billId: string) {
  try {
    const session = await requireRole([
      "admin",
      "central_staff",
      "regional_staff",
      "auditor",
      "strategy_finance",
    ]);

    // Fetch logs with user name
    const logs = await db
      .select({
        id: billActivityLogs.id,
        action: billActivityLogs.action,
        details: billActivityLogs.details,
        createdAt: billActivityLogs.createdAt,
        userName: user.name,
        userRole: user.role,
        departmentName: departments.fullName,
      })
      .from(billActivityLogs)
      .leftJoin(user, eq(billActivityLogs.userId, user.id))
      .leftJoin(departments, eq(user.departmentId, departments.id))
      .where(eq(billActivityLogs.billId, billId))
      .orderBy(desc(billActivityLogs.createdAt));

    return logs;
  } catch (error) {
    console.error("Error fetching bill logs:", error);
    return [];
  }
}

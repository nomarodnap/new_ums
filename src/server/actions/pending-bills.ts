"use server";

import { z } from "zod";
import { db } from "@/server/db";
import { utilityBills } from "@/server/db/schema";
import { requireRole } from "@/server/auth";

import { runAuditChecks } from "@/server/actions/audits";

const createPendingBillSchema = z.object({
  departmentId: z.string().min(1, "กรุณาเลือกหน่วยงาน"),
  utilityType: z.string().min(1, "กรุณาเลือกประเภทสาธารณูปโภค"),
  billingMonth: z.string().min(1, "กรุณาเลือกเดือนที่ค้างชำระ"),
  provider: z.string().optional(),
  serviceNumber: z.string().optional(),
  locationType: z.string().optional(),
  estimatedAmountBaht: z.coerce.number().min(0, "ยอดเงินต้องมากกว่าหรือเท่ากับ 0"),
});

export async function createPendingBill(prevState: any, formData: FormData) {
  try {
    const session = await requireRole([
      "admin",
      "central_staff",
      "regional_staff",
    ]);

    const parsed = createPendingBillSchema.safeParse({
      departmentId: formData.get("departmentId"),
      utilityType: formData.get("utilityType"),
      billingMonth: formData.get("billingMonth"),
      provider: formData.get("provider"),
      serviceNumber: formData.get("serviceNumber"),
      locationType: formData.get("locationType"),
      estimatedAmountBaht: formData.get("estimatedAmountBaht"),
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.flatten().fieldErrors,
      };
    }

    const billingMonthDate = new Date(parsed.data.billingMonth);
    const billId = crypto.randomUUID();

    await db.insert(utilityBills).values({
      id: billId,
      departmentId: parsed.data.departmentId,
      utilityType: parsed.data.utilityType,
      billingMonth: billingMonthDate.getMonth() + 1,
      billingYear: billingMonthDate.getFullYear(),
      provider: parsed.data.provider,
      serviceNumber: parsed.data.serviceNumber,
      locationType: parsed.data.locationType,
      estimatedAmount: parsed.data.estimatedAmountBaht.toString(),
      paymentStatus: "PENDING",
      invoiceStatus: "NOT_RECEIVED",
      isPendingBillOnly: true,
      createdBy: session.user.id,
    });

    // Run automated audit checks in the background
    runAuditChecks(billId, session.user.id).catch(console.error);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล หรือท่านไม่มีสิทธิ์ในการทำรายการนี้",
    };
  }
}

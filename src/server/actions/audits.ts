"use server";

import { db } from "@/server/db";
import {
  utilityBills,
  audits,
  budgetCodes,
  departmentServices,
  billActivityLogs,
} from "@/server/db/schema";
import { requireRole } from "@/server/auth";
import { eq, and } from "drizzle-orm";
import {
  differenceInDays,
  differenceInMonths,
  isAfter,
  addMonths,
} from "date-fns";

export async function runAuditChecks(
  billId: string,
  currentUserId: string,
  checkOthers: boolean = true,
) {
  // Fetch the bill
  const [bill] = await db
    .select()
    .from(utilityBills)
    .where(eq(utilityBills.id, billId));
  if (!bill) return;

  // Initialize flags
  let isLateReceive = false;
  let isLatePayment = false;
  let isOverdueMoreThan2Months = false;
  let isDisbursementOver2Months = false; // เบิกจ่ายใช้เวลาเกิน 2 เดือน
  let isWrongMonth = false;
  let isPhoneOverLimit = false; // เบิกค่าโทรศัพท์เกินเกณฑ์
  let isPhoneUsageOverLimit = false; // ใช้ค่าโทรศัพท์เกินเกณฑ์
  let isWrongBudget = false;
  let isDuplicate = false;

  // 1. รับใบแจ้งหนี้จากผู้ให้บริการ > 30 วัน
  if (bill.invoiceDate && bill.receivedDate) {
    if (
      differenceInDays(
        new Date(bill.receivedDate),
        new Date(bill.invoiceDate),
      ) > 30
    ) {
      isLateReceive = true;
    }
  }

  // 3. ชำระค่าบริการ > 15 วัน (หลังจากวันที่รับบิล)
  if (bill.receivedDate && bill.paymentDate) {
    if (
      differenceInDays(
        new Date(bill.paymentDate),
        new Date(bill.receivedDate),
      ) > 15
    ) {
      isLatePayment = true;
    }
  }

  // 4. มีหนี้ค้างชำระ > 2 เดือน (รวมเงื่อนไขเบิกจ่ายเกิน 2 เดือนเข้าด้วยกัน)
  // เงื่อนไข:
  // 1) หากยังไม่ได้รับใบแจ้งหนี้: ใช้รอบบิลประจำเดือน (billingYear, billingMonth) เทียบกับวันปัจจุบัน หากผลต่างเกิน 2 เดือนจะขึ้นสถานะ
  // 2) หากได้รับใบแจ้งหนี้แล้ว แต่ยังไม่ได้เบิกจ่าย: ใช้วันที่ใบแจ้งหนี้ (invoiceDate) เทียบกับวันปัจจุบัน หากเกิน 2 เดือนจะขึ้นสถานะ
  // 3) หากได้รับใบแจ้งหนี้แล้ว และเบิกจ่ายแล้ว: ใช้วันที่ใบแจ้งหนี้ (invoiceDate) เทียบกับวันที่เอกสารเบิกจ่าย (paymentDate) หากเกิน 2 เดือนจะขึ้นสถานะ
  if (bill.invoiceStatus === "NOT_RECEIVED" || !bill.invoiceDate) {
    // กรณีที่ 1: ยังไม่ได้รับใบแจ้งหนี้ (หรือไม่มีวันที่ใบแจ้งหนี้) -> เทียบรอบบิลกับวันปัจจุบัน
    if (bill.billingYear && bill.billingMonth) {
      const now = new Date();
      const diffInMonths =
        now.getFullYear() * 12 +
        now.getMonth() +
        1 -
        (bill.billingYear * 12 + bill.billingMonth);

      if (diffInMonths > 2) {
        isOverdueMoreThan2Months = true;
      }
    }
  } else if (bill.invoiceStatus === "RECEIVED" && bill.invoiceDate) {
    const invDate = new Date(bill.invoiceDate);

    if (bill.paymentStatus === "PAID" && bill.paymentDate) {
      // กรณีที่ 3: ได้รับใบแจ้งหนี้แล้ว และเบิกจ่ายแล้ว -> เทียบวันที่ใบแจ้งหนี้ กับ วันที่เอกสารเบิกจ่าย
      const payDate = new Date(bill.paymentDate);
      if (
        isAfter(payDate, addMonths(invDate, 2)) ||
        differenceInDays(payDate, invDate) > 60
      ) {
        isOverdueMoreThan2Months = true;
      }
    } else {
      // กรณีที่ 2: ได้รับใบแจ้งหนี้แล้ว แต่ยังไม่ได้เบิกจ่าย -> เทียบวันที่ใบแจ้งหนี้ กับ วันเดือนปีปัจจุบัน
      const now = new Date();
      if (
        isAfter(now, addMonths(invDate, 2)) ||
        differenceInDays(now, invDate) > 60
      ) {
        isOverdueMoreThan2Months = true;
      }
    }
  }

  // 5. นำใบแจ้งหนี้ของเดือนอื่น ที่ไม่ใช่เดือน ส.ค. – ก.ย. ของปีงบประมาณที่ผ่านมาเบิก (เบิกจ่ายผิดเดือน)
  // 1) คำนวณปีงบประมาณของรอบบิล (Bill Fiscal Year พ.ศ.)
  const billYearBE =
    bill.billingYear < 2400 ? bill.billingYear + 543 : bill.billingYear;
  const billFiscalYearBE =
    bill.billingMonth >= 10 ? billYearBE + 1 : billYearBE;

  // 2) หาปีงบประมาณจากรหัสงบประมาณ (Budget Code Fiscal Year พ.ศ.)
  let budgetFiscalYearBE: number | null = null;
  if (bill.budgetCode && bill.budgetCode.trim() !== "") {
    const cleanBudgetCode = bill.budgetCode.trim();
    // 2.1 หาจากฐานข้อมูล budget_codes
    const [bc] = await db
      .select()
      .from(budgetCodes)
      .where(eq(budgetCodes.code, cleanBudgetCode));
    if (bc && bc.fiscalYear) {
      budgetFiscalYearBE =
        bc.fiscalYear < 2400 ? bc.fiscalYear + 543 : bc.fiscalYear;
    } else {
      // 2.2 สกัดจากตัวเลขใน budgetCode เช่น 2568, 2569 หรือขึ้นต้นด้วย 68, 69
      const match4 = cleanBudgetCode.match(/(25[5-7][0-9])/);
      if (match4) {
        budgetFiscalYearBE = parseInt(match4[1], 10);
      } else {
        const match2 = cleanBudgetCode.match(/^(6[0-9]|7[0-9])/);
        if (match2) {
          budgetFiscalYearBE = 2500 + parseInt(match2[1], 10);
        }
      }
    }
  }

  // 2.3 ถ้าไม่มีรหัสงบประมาณ ให้ใช้วันที่เบิกจ่าย (paymentDate) หรือวันปัจจุบันเป็นเกณฑ์อ้างอิง
  if (!budgetFiscalYearBE) {
    const refDate = bill.paymentDate ? new Date(bill.paymentDate) : new Date();
    const refYearBE = refDate.getFullYear() + 543;
    budgetFiscalYearBE =
      refDate.getMonth() >= 9 ? refYearBE + 1 : refYearBE;
  }

  // 3) เปรียบเทียบปีงบประมาณของรอบบิล กับ ปีงบประมาณที่ใช้เบิกจ่าย
  if (billFiscalYearBE < budgetFiscalYearBE) {
    // นำบิลของปีงบประมาณก่อนหน้ามาเบิกจ่ายในปีงบประมาณนี้
    // อนุญาตเฉพาะรอบบิลเดือน สิงหาคม (เดือน 8) และ กันยายน (เดือน 9) เท่านั้น
    if (bill.billingMonth !== 8 && bill.billingMonth !== 9) {
      isWrongMonth = true;
    }
  } else if (billFiscalYearBE > budgetFiscalYearBE) {
    // นำบิลของปีงบประมาณอนาคตมาเบิกด้วยงบปีก่อนหน้า
    isWrongMonth = true;
  }

  // 6. ตรวจสอบค่าโทรศัพท์: ใช้ค่าโทรศัพท์เกินเกณฑ์ และ เบิกค่าโทรศัพท์เกินเกณฑ์
  if (
    (bill.utilityType === "ค่าโทรศัพท์" ||
      bill.utilityType === "ค่าสื่อสาร&โทรคมนาคม") &&
    bill.serviceNumber
  ) {
    const paid =
      bill.paidAmount !== null && bill.paidAmount !== undefined
        ? Number(bill.paidAmount)
        : null;
    const serviceNumbers = bill.serviceNumber
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    let breakdownMap: Record<string, number> = {};
    if (bill.serviceBreakdown) {
      try {
        const parsed =
          typeof bill.serviceBreakdown === "string"
            ? JSON.parse(bill.serviceBreakdown)
            : bill.serviceBreakdown;
        if (parsed && typeof parsed === "object") {
          for (const [k, v] of Object.entries(parsed)) {
            const numVal = parseFloat(String(v));
            if (!isNaN(numVal)) {
              breakdownMap[k.trim()] = numVal;
            }
          }
        }
      } catch (e) {
        console.error("Error parsing serviceBreakdown in audit checks:", e);
      }
    }

    const hasBreakdown = Object.keys(breakdownMap).length > 0;
    let maxReimbursableTotal = 0;
    let hasAnyLimitRule = false;

    for (const num of serviceNumbers) {
      const [service] = await db
        .select()
        .from(departmentServices)
        .where(
          and(
            eq(departmentServices.serviceNumber, num),
            eq(departmentServices.departmentId, bill.departmentId),
          ),
        );

      const billedForNum =
        hasBreakdown && breakdownMap[num] !== undefined
          ? breakdownMap[num]
          : serviceNumbers.length === 1
            ? Number(bill.invoiceAmount || bill.paidAmount || 0)
            : 0;

      if (
        service &&
        service.phoneOwnerName &&
        service.phoneReimbursementLimit &&
        service.phoneReimbursementLimit > 0
      ) {
        hasAnyLimitRule = true;
        // ใช้ค่าโทรศัพท์เกินเกณฑ์: ตรวจสอบจากยอดตามใบแจ้งหนี้/Breakdown เทียบกับสิทธิ (ขึ้นข้อสังเกตได้ทันทีตั้งแต่ยังไม่เบิกจ่าย)
        if (billedForNum > service.phoneReimbursementLimit + 0.001) {
          isPhoneUsageOverLimit = true;
        }

        // หากโทรศัพท์เบอร์ใดเบอร์หนึ่งในใบแจ้งหนี้เกินสิทธิ ให้ปัดเป็นจำนวนเงินเพดานตามสิทธิ
        const eligible =
          billedForNum > 0
            ? Math.min(billedForNum, service.phoneReimbursementLimit)
            : service.phoneReimbursementLimit;
        maxReimbursableTotal += eligible;
      } else {
        // ไม่มีเพดานสิทธิ (เช่น เบอร์ประจำสำนักงาน) เบิกได้ตามยอดจริง
        maxReimbursableTotal += billedForNum;
      }
    }

    // เบิกค่าโทรศัพท์เกินเกณฑ์: ตรวจสอบเมื่อมีการระบุยอดที่เบิกจ่ายจริง (paidAmount)
    if (
      paid !== null &&
      hasAnyLimitRule &&
      paid > maxReimbursableTotal + 0.001
    ) {
      isPhoneOverLimit = true;
    }
  }

  // 7. ใช้จ่ายผิดประเภท/แหล่งของเงิน/แผนงาน (To be manually flagged or based on rules)
  // For now, assume false unless manually flagged.

  // 8. เบิกจ่ายซ้ำ (ตรวจจากเลขที่ใบแจ้งหนี้ที่ซ้ำกัน ในประเภทสาธารณูปโภคและหน่วยงานเดียวกัน)
  // ให้ขึ้นเฉพาะรายการของ "เดือนหลัง" (หรือรายการที่สร้างทีหลัง) เท่านั้น รายการแรกจะไม่ขึ้นซ้ำซ้อน
  if (
    bill.invoiceNumber &&
    bill.invoiceNumber.trim() !== "" &&
    bill.invoiceNumber !== "-"
  ) {
    const duplicates = await db
      .select()
      .from(utilityBills)
      .where(
        and(
          eq(utilityBills.invoiceNumber, bill.invoiceNumber),
          eq(utilityBills.departmentId, bill.departmentId),
          eq(utilityBills.utilityType, bill.utilityType),
        ),
      );
    if (duplicates.length > 1) {
      // เรียงลำดับเพื่อหาบิลรายการแรกสุด (เดือนก่อนหน้า หรือสร้างก่อนหน้า)
      duplicates.sort((a, b) => {
        const timeA = (a.billingYear || 0) * 12 + (a.billingMonth || 0);
        const timeB = (b.billingYear || 0) * 12 + (b.billingMonth || 0);
        if (timeA !== timeB) return timeA - timeB;

        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (createdA !== createdB) return createdA - createdB;

        return a.id.localeCompare(b.id);
      });

      const earliestBill = duplicates[0];
      // ถ้าบิลปัจจุบันไม่ใช่รายการแรกสุด -> เป็นบิลเดือนหลังที่เบิกจ่ายซ้ำ
      if (bill.id !== earliestBill.id) {
        isDuplicate = true;
      }

      // ตรวจสอบและอัพเดทบิลอื่นในกลุ่มเดียวกันด้วย เพื่อให้รายการแรกถูกปลดสถานะซ้ำซ้อน
      if (checkOthers) {
        for (const other of duplicates) {
          if (other.id !== bill.id) {
            runAuditChecks(other.id, currentUserId, false).catch(console.error);
          }
        }
      }
    }
  }

  // 9. ค่าใช้จ่ายเพิ่มขึ้นผิดปกติ (> 30% เทียบกับรอบบิลเดือนก่อนหน้าของหมายเลขบริการ/หน่วยงานเดียวกัน)
  let isAnomalyExpense = false;
  const currentBillAmount = Number(bill.invoiceAmount || bill.paidAmount || 0);
  if (currentBillAmount > 0 && bill.billingMonth && bill.billingYear) {
    const prevMonth = bill.billingMonth === 1 ? 12 : bill.billingMonth - 1;
    const prevYear =
      bill.billingMonth === 1 ? bill.billingYear - 1 : bill.billingYear;

    const prevBills = await db
      .select()
      .from(utilityBills)
      .where(
        and(
          eq(utilityBills.departmentId, bill.departmentId),
          eq(utilityBills.utilityType, bill.utilityType),
          eq(utilityBills.billingMonth, prevMonth),
          eq(utilityBills.billingYear, prevYear),
        ),
      );

    let prevAmount = 0;
    if (bill.serviceNumber) {
      const currentNumbers = bill.serviceNumber
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const matchingPrevBill = prevBills.find((pb) => {
        if (!pb.serviceNumber) return false;
        const pbNumbers = pb.serviceNumber
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        return currentNumbers.some((num) => pbNumbers.includes(num));
      });
      if (matchingPrevBill) {
        prevAmount = Number(
          matchingPrevBill.invoiceAmount || matchingPrevBill.paidAmount || 0,
        );
      }
    } else if (prevBills.length > 0) {
      prevAmount = Number(
        prevBills[0].invoiceAmount || prevBills[0].paidAmount || 0,
      );
    }

    if (prevAmount > 0 && currentBillAmount > prevAmount * 1.3) {
      isAnomalyExpense = true;
    }
  }

  // Check if audit record already exists
  const [existingAudit] = await db
    .select()
    .from(audits)
    .where(eq(audits.utilityBillId, billId));

  const isManualAnomaly = existingAudit?.isManualAnomaly || false;
  const manualAnomalyReason = existingAudit?.manualAnomalyReason || null;

  const hasIssues =
    isLateReceive ||
    isLatePayment ||
    isOverdueMoreThan2Months ||
    isDisbursementOver2Months ||
    isWrongMonth ||
    isPhoneOverLimit ||
    isPhoneUsageOverLimit ||
    isWrongBudget ||
    isDuplicate ||
    isAnomalyExpense ||
    isManualAnomaly;

  if (hasIssues) {
    if (existingAudit) {
      await db
        .update(audits)
        .set({
          isLateReceive,
          isLatePayment,
          isOverdueMoreThan2Months,
          isDisbursementOver2Months,
          isWrongMonth,
          isPhoneOverLimit,
          isPhoneUsageOverLimit,
          isWrongBudget,
          isDuplicate,
          isAnomalyExpense,
          status: "PENDING_CORRECTION",
          updatedAt: new Date(),
        })
        .where(eq(audits.id, existingAudit.id));
    } else {
      await db.insert(audits).values({
        id: crypto.randomUUID(),
        utilityBillId: billId,
        auditorId: "SYSTEM", // Auto generated
        isLateReceive,
        isLatePayment,
        isOverdueMoreThan2Months,
        isDisbursementOver2Months,
        isWrongMonth,
        isPhoneOverLimit,
        isPhoneUsageOverLimit,
        isWrongBudget,
        isDuplicate,
        isAnomalyExpense,
        isManualAnomaly,
        manualAnomalyReason,
        status: "PENDING_CORRECTION",
      });
    }
  } else {
    // No issues found, but maybe there was an existing audit record that is now corrected
    if (existingAudit) {
      // We can either delete it or mark it as CORRECTED. Marking it as CORRECTED keeps history.
      await db
        .update(audits)
        .set({
          isLateReceive: false,
          isLatePayment: false,
          isOverdueMoreThan2Months: false,
          isDisbursementOver2Months: false,
          isWrongMonth: false,
          isPhoneOverLimit: false,
          isPhoneUsageOverLimit: false,
          isWrongBudget: false,
          isDuplicate: false,
          isAnomalyExpense: false,
          status: "CORRECTED",
          updatedAt: new Date(),
        })
        .where(eq(audits.id, existingAudit.id));
    }
  }
}

export async function resolveAudit(prevState: any, formData: FormData) {
  try {
    const session = await requireRole([
      "admin",
      "auditor",
      "central_staff",
      "regional_staff",
    ]);

    const auditId = formData.get("auditId") as string;
    const remarks = formData.get("remarks") as string;
    // In a real app, handle file upload here and get the URL
    // const file = formData.get("attachment") as File;

    if (!auditId) {
      return { success: false, error: "Audit ID is missing" };
    }

    await db
      .update(audits)
      .set({
        status: "CORRECTED",
        remarks: remarks,
        updatedAt: new Date(),
      })
      .where(eq(audits.id, auditId));

    // Insert log
    const [auditRecord] = await db
      .select({ billId: audits.utilityBillId })
      .from(audits)
      .where(eq(audits.id, auditId));
    if (auditRecord) {
      await db.insert(billActivityLogs).values({
        id: crypto.randomUUID(),
        billId: auditRecord.billId,
        userId: session.user.id,
        action: "AUDITED",
        details: `ตรวจสอบแก้ไขความผิดปกติ: ${remarks || "ไม่มีหมายเหตุ"}`,
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Unauthorized or failed to update" };
  }
}

export async function flagManualAnomaly(billId: string, reason: string) {
  try {
    const session = await requireRole(["admin"]);

    if (!billId || !reason) {
      return { success: false, error: "ข้อมูลไม่ครบถ้วน" };
    }

    const [existingAudit] = await db
      .select()
      .from(audits)
      .where(eq(audits.utilityBillId, billId));

    if (existingAudit) {
      await db
        .update(audits)
        .set({
          isManualAnomaly: true,
          manualAnomalyReason: reason,
          status: "PENDING_CORRECTION",
          updatedAt: new Date(),
        })
        .where(eq(audits.id, existingAudit.id));
    } else {
      await db.insert(audits).values({
        id: crypto.randomUUID(),
        utilityBillId: billId,
        auditorId: session.user.id,
        isManualAnomaly: true,
        manualAnomalyReason: reason,
        status: "PENDING_CORRECTION",
      });
    }

    await db.insert(billActivityLogs).values({
      id: crypto.randomUUID(),
      billId: billId,
      userId: session.user.id,
      action: "AUDITED",
      details: `พบความผิดปกติ (บันทึกด้วยตนเอง): ${reason}`,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "ไม่มีสิทธิ์ดำเนินการ หรือเกิดข้อผิดพลาด" };
  }
}

export async function unflagManualAnomaly(billId: string) {
  try {
    const session = await requireRole(["admin"]);

    if (!billId) return { success: false, error: "ข้อมูลไม่ครบถ้วน" };

    const [existingAudit] = await db
      .select()
      .from(audits)
      .where(eq(audits.utilityBillId, billId));

    if (existingAudit) {
      const hasOtherIssues =
        existingAudit.isLateReceive ||
        existingAudit.isLatePayment ||
        existingAudit.isOverdueMoreThan2Months ||
        existingAudit.isDisbursementOver2Months ||
        existingAudit.isWrongMonth ||
        existingAudit.isPhoneOverLimit ||
        existingAudit.isPhoneUsageOverLimit ||
        existingAudit.isWrongBudget ||
        existingAudit.isDuplicate ||
        existingAudit.isAnomalyExpense;

      await db
        .update(audits)
        .set({
          isManualAnomaly: false,
          manualAnomalyReason: null,
          status: hasOtherIssues ? "PENDING_CORRECTION" : "CORRECTED",
          updatedAt: new Date(),
        })
        .where(eq(audits.id, existingAudit.id));

      await db.insert(billActivityLogs).values({
        id: crypto.randomUUID(),
        billId: billId,
        userId: session.user.id,
        action: "AUDITED",
        details: `ยกเลิกการตั้งค่าความผิดปกติด้วยตนเอง`,
      });
    }

      return { success: true };
    } catch (error) {
      return { success: false, error: "ไม่มีสิทธิ์ดำเนินการ หรือเกิดข้อผิดพลาด" };
    }
  }

export async function recheckAllAudits() {
  try {
    const allBills = await db.select({ id: utilityBills.id }).from(utilityBills);
    for (const bill of allBills) {
      await runAuditChecks(bill.id, "SYSTEM");
    }
    return { success: true, count: allBills.length };
  } catch (error) {
    console.error("Error in recheckAllAudits:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล" };
  }
}

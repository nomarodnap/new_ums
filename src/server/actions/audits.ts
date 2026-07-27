"use server";

import { db } from "@/server/db";
import { utilityBills, audits, departmentServices, billActivityLogs } from "@/server/db/schema";
import { requireRole } from "@/server/auth";
import { eq, and } from "drizzle-orm";
import { differenceInDays, differenceInMonths, isAfter, addMonths } from "date-fns";

export async function runAuditChecks(billId: string, currentUserId: string) {
  // Fetch the bill
  const [bill] = await db.select().from(utilityBills).where(eq(utilityBills.id, billId));
  if (!bill) return;

  // Initialize flags
  let isLateReceive = false;

  let isLatePayment = false;
  let isOverdueMoreThan2Months = false;
  let isWrongMonth = false;
  let isPhoneOverLimit = false;
  let isWrongBudget = false;
  let isDuplicate = false;

  // 1. รับใบแจ้งหนี้จากผู้ให้บริการ > 30 วัน
  if (bill.invoiceDate && bill.receivedDate) {
    if (differenceInDays(new Date(bill.receivedDate), new Date(bill.invoiceDate)) > 30) {
      isLateReceive = true;
    }
  }



  // 3. ชำระค่าบริการ > 15 วัน (หลังจากวันที่รับบิล)
  if (bill.receivedDate && bill.paymentDate) {
    if (differenceInDays(new Date(bill.paymentDate), new Date(bill.receivedDate)) > 15) {
      isLatePayment = true;
    }
  }

  // 4. มีหนี้ค้างชำระ > 2 เดือน
  // หักลบกันระหว่าง รอบบิลประจำเดือน กับ วันที่เบิกจ่ายแล้วเสร็จ เกิน 2 เดือน
  if (bill.billingYear && bill.billingMonth) {
    const endCompareDate = bill.paymentDate ? new Date(bill.paymentDate) : new Date();
    
    // นับแค่เดือน: (ปีที่จ่าย * 12 + เดือนที่จ่าย) - (ปีบิล * 12 + เดือนบิล)
    const diffInMonths = (endCompareDate.getFullYear() * 12 + endCompareDate.getMonth() + 1) - (bill.billingYear * 12 + bill.billingMonth);
    
    if (diffInMonths > 2) {
      isOverdueMoreThan2Months = true;
    }
  }

  // 5. นำใบแจ้งหนี้ของเดือนอื่น ที่ไม่ใช่เดือน ส.ค. – ก.ย. ของปีงบประมาณที่ผ่านมาเบิก
  // Assuming current fiscal year starts in October. 
  const now = new Date();
  const currentFiscalYear = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
  const billFiscalYear = bill.billingMonth >= 10 ? bill.billingYear + 1 : bill.billingYear;
  
  if (billFiscalYear < currentFiscalYear) {
    // It's from a previous fiscal year
    // Check if it's NOT Aug (8) or Sep (9)
    if (bill.billingMonth !== 8 && bill.billingMonth !== 9) {
      isWrongMonth = true;
    }
  }

  // 6. เบิกจ่ายค่าโทรศัพท์เกินสิทธิ (อิงจากเพดานการเบิกจ่ายของเบอร์ เทียบกับยอดที่เบิกจ่ายจริง)
  if (bill.utilityType === 'ค่าโทรศัพท์' && bill.paidAmount && bill.serviceNumber) {
    const amount = Number(bill.paidAmount);
    const serviceNumbers = bill.serviceNumber.split(',').map(s => s.trim()).filter(Boolean);
    let totalLimit = 0;
    let hasMobilePhone = false;
    
    for (const num of serviceNumbers) {
      const [service] = await db.select().from(departmentServices).where(
        and(
          eq(departmentServices.serviceNumber, num),
          eq(departmentServices.departmentId, bill.departmentId)
        )
      );
      if (service && service.phoneOwnerName && service.phoneReimbursementLimit) {
        totalLimit += service.phoneReimbursementLimit;
        hasMobilePhone = true;
      }
    }
    
    if (hasMobilePhone && totalLimit > 0 && amount > totalLimit) {
      isPhoneOverLimit = true;
    }
  }

  // 7. ใช้จ่ายผิดประเภท/แหล่งของเงิน/แผนงาน (To be manually flagged or based on rules)
  // For now, assume false unless manually flagged.

  // 8. เบิกจ่ายซ้ำ (ตรวจจากเลขที่ใบแจ้งหนี้ที่ซ้ำกัน ในประเภทสาธารณูปโภคและหน่วยงานเดียวกัน)
  if (bill.invoiceNumber && bill.invoiceNumber.trim() !== "" && bill.invoiceNumber !== "-") {
    const duplicates = await db.select().from(utilityBills).where(
      and(
        eq(utilityBills.invoiceNumber, bill.invoiceNumber),
        eq(utilityBills.departmentId, bill.departmentId),
        eq(utilityBills.utilityType, bill.utilityType)
      )
    );
    if (duplicates.length > 1) {
      isDuplicate = true;
    }
  }

  // Check if audit record already exists
  const [existingAudit] = await db.select().from(audits).where(eq(audits.utilityBillId, billId));
  
  const isManualAnomaly = existingAudit?.isManualAnomaly || false;
  const manualAnomalyReason = existingAudit?.manualAnomalyReason || null;

  const hasIssues = isLateReceive || isLatePayment || isOverdueMoreThan2Months || isWrongMonth || isPhoneOverLimit || isWrongBudget || isDuplicate || isManualAnomaly;

  if (hasIssues) {
    if (existingAudit) {
      await db.update(audits).set({
        isLateReceive,

        isLatePayment,
        isOverdueMoreThan2Months,
        isWrongMonth,
        isPhoneOverLimit,
        isWrongBudget,
        isDuplicate,
        status: 'PENDING_CORRECTION',
        updatedAt: new Date()
      }).where(eq(audits.id, existingAudit.id));
    } else {
      await db.insert(audits).values({
        id: crypto.randomUUID(),
        utilityBillId: billId,
        auditorId: 'SYSTEM', // Auto generated
        isLateReceive,

        isLatePayment,
        isOverdueMoreThan2Months,
        isWrongMonth,
        isPhoneOverLimit,
        isWrongBudget,
        isDuplicate,
        isManualAnomaly,
        manualAnomalyReason,
        status: 'PENDING_CORRECTION'
      });
    }
  } else {
    // No issues found, but maybe there was an existing audit record that is now corrected
    if (existingAudit) {
      // We can either delete it or mark it as CORRECTED. Marking it as CORRECTED keeps history.
      await db.update(audits).set({
        isLateReceive: false,

        isLatePayment: false,
        isOverdueMoreThan2Months: false,
        isWrongMonth: false,
        isPhoneOverLimit: false,
        isWrongBudget: false,
        isDuplicate: false,
        status: 'CORRECTED',
        updatedAt: new Date()
      }).where(eq(audits.id, existingAudit.id));
    }
  }
}

export async function resolveAudit(prevState: any, formData: FormData) {
  try {
    const session = await requireRole(["admin", "auditor", "central_staff", "regional_staff"]);
    
    const auditId = formData.get("auditId") as string;
    const remarks = formData.get("remarks") as string;
    // In a real app, handle file upload here and get the URL
    // const file = formData.get("attachment") as File;
    
    if (!auditId) {
      return { success: false, error: "Audit ID is missing" };
    }

    await db.update(audits).set({
      status: 'CORRECTED',
      remarks: remarks,
      updatedAt: new Date()
    }).where(eq(audits.id, auditId));
    
    // Insert log
    const [auditRecord] = await db.select({ billId: audits.utilityBillId }).from(audits).where(eq(audits.id, auditId));
    if (auditRecord) {
      await db.insert(billActivityLogs).values({
        id: crypto.randomUUID(),
        billId: auditRecord.billId,
        userId: session.user.id,
        action: "AUDITED",
        details: `ตรวจสอบแก้ไขความผิดปกติ: ${remarks || 'ไม่มีหมายเหตุ'}`,
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

    const [existingAudit] = await db.select().from(audits).where(eq(audits.utilityBillId, billId));
    
    if (existingAudit) {
      await db.update(audits).set({
        isManualAnomaly: true,
        manualAnomalyReason: reason,
        status: 'PENDING_CORRECTION',
        updatedAt: new Date()
      }).where(eq(audits.id, existingAudit.id));
    } else {
      await db.insert(audits).values({
        id: crypto.randomUUID(),
        utilityBillId: billId,
        auditorId: session.user.id,
        isManualAnomaly: true,
        manualAnomalyReason: reason,
        status: 'PENDING_CORRECTION'
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

    const [existingAudit] = await db.select().from(audits).where(eq(audits.utilityBillId, billId));
    
    if (existingAudit) {
      const hasOtherIssues = existingAudit.isLateReceive || existingAudit.isLatePayment || existingAudit.isOverdueMoreThan2Months || existingAudit.isWrongMonth || existingAudit.isPhoneOverLimit || existingAudit.isWrongBudget || existingAudit.isDuplicate;

      await db.update(audits).set({
        isManualAnomaly: false,
        manualAnomalyReason: null,
        status: hasOtherIssues ? 'PENDING_CORRECTION' : 'CORRECTED',
        updatedAt: new Date()
      }).where(eq(audits.id, existingAudit.id));
      
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


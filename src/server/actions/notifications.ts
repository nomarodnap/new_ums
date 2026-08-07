"use server";

import { db } from "@/server/db";
import { notifications, departments, budgets, utilityBills, departmentServices } from "@/server/db/schema";
import { eq, and, or, sql, isNull, desc, lt, lte, gt, gte } from "drizzle-orm";
import { requireRole } from "@/server/auth";
import { revalidatePath } from "next/cache";

type CreateNotificationProps = {
  departmentId?: string | null;
  targetRole?: string | null;
  title: string;
  message: string;
  type: string;
  severity?: "NORMAL" | "WARNING" | "URGENT";
  link?: string | null;
};

export async function createNotification(props: CreateNotificationProps) {
  const { departmentId = null, targetRole = null, title, message, type, severity = "NORMAL", link = null } = props;

  await db.insert(notifications).values({
    id: crypto.randomUUID(),
    departmentId,
    targetRole,
    title,
    message,
    type,
    severity,
    link,
  });
}

export async function getMyNotifications() {
  const session = await requireRole(["admin", "auditor", "central_staff", "regional_staff", "strategy_finance", "user"]);
  const user = session.user as any;
  
  let conditions = [isNull(notifications.departmentId)];
  
  if (user.departmentId) {
    conditions.push(eq(notifications.departmentId, user.departmentId));
  }
  
  const myNotifs = await db.select()
    .from(notifications)
    .where(
      user.departmentId 
        ? or(isNull(notifications.departmentId), eq(notifications.departmentId, user.departmentId))
        : isNull(notifications.departmentId)
    )
    .orderBy(desc(notifications.createdAt))
    .limit(50);
    
  return myNotifs;
}

export async function markAsRead(id: string) {
  await requireRole(["admin", "auditor", "central_staff", "regional_staff", "strategy_finance", "user"]);
  
  await db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, id));
    
  revalidatePath("/", "layout");
  return { success: true };
}

export async function markAllAsRead() {
  const session = await requireRole(["admin", "auditor", "central_staff", "regional_staff", "strategy_finance", "user"]);
  const user = session.user as any;

  await db.update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.isRead, false),
        user.departmentId 
          ? or(isNull(notifications.departmentId), eq(notifications.departmentId, user.departmentId))
          : isNull(notifications.departmentId)
      )
    );

  revalidatePath("/", "layout");
  return { success: true };
}

export async function runNotificationEngine(mode: "all" | "missing_data" | "daily" = "all") {
  console.log(`🚀 Running Notification Engine in mode: ${mode}`);
  const today = new Date();
  
  // 1. Budget Limit Warning (80% used) - [DEFERRED]
  /*
  const allBudgets = await db.select({
    id: budgets.id,
    departmentId: budgets.departmentId,
    name: budgets.name,
    allocatedAmount: budgets.allocatedAmount,
    transferredAmount: budgets.transferredAmount,
  })
  .from(budgets);
  
  for (const b of allBudgets) {
    const allocated = Number(b.allocatedAmount || 0);
    const transferred = Number(b.transferredAmount || 0);
    
    if (allocated > 0 && (transferred / allocated) >= 0.8) {
      await createNotification({
        departmentId: b.departmentId,
        title: "แจ้งเตือนงบประมาณใกล้หมด",
        message: `งบประมาณ ${b.name} มีการเบิกจ่ายไปแล้ว ${((transferred/allocated)*100).toFixed(2)}% (${transferred} / ${allocated} บาท)`,
        type: "BUDGET_LIMIT",
        severity: "WARNING",
      });
    }
  }
  */
  
  // 2. Missing Data Reminder (e.g., 23rd of the month)
  if ((mode === "all" || mode === "missing_data") && today.getDate() === 23) { // Trigger 2 days before 25th
    let targetMonth = today.getMonth(); // 0 for Jan, 1 for Feb...
    let targetYear = today.getFullYear();
    
    if (targetMonth === 0) {
      targetMonth = 12;
      targetYear -= 1;
    }

    const allServices = await db.select({
      id: departmentServices.id,
      departmentId: departmentServices.departmentId,
      utilityType: departmentServices.utilityType,
      serviceNumber: departmentServices.serviceNumber,
      departmentName: departments.fullName
    })
    .from(departmentServices)
    .leftJoin(departments, eq(departmentServices.departmentId, departments.id));

    const currentMonthBills = await db.select({
      id: utilityBills.id,
      departmentId: utilityBills.departmentId,
      serviceNumber: utilityBills.serviceNumber
    })
    .from(utilityBills)
    .where(
      and(
        eq(utilityBills.billingMonth, targetMonth),
        eq(utilityBills.billingYear, targetYear)
      )
    );

    const billedServiceNumbers = new Set<string>();
    for (const bill of currentMonthBills) {
      if (bill.serviceNumber) {
        bill.serviceNumber.split(',').forEach(s => billedServiceNumbers.add(s.trim()));
      }
    }

    const missingByDept: Record<string, { deptName: string, missingServices: string[] }> = {};
    
    for (const service of allServices) {
      if (service.serviceNumber && service.departmentId && !billedServiceNumbers.has(service.serviceNumber)) {
        if (!missingByDept[service.departmentId]) {
          missingByDept[service.departmentId] = { deptName: service.departmentName || "ไม่ระบุหน่วยงาน", missingServices: [] };
        }
        missingByDept[service.departmentId].missingServices.push(`${service.utilityType} (${service.serviceNumber})`);
      }
    }

    const title = `แจ้งเตือนให้บันทึกข้อมูลรอบบิลเดือน ${targetMonth}/${targetYear}`;
    
    const sentNotifs = await db.select({ departmentId: notifications.departmentId })
      .from(notifications)
      .where(
        and(
          eq(notifications.type, "MISSING_DATA"),
          eq(notifications.title, title)
        )
      );
    const sentDeptIds = new Set(sentNotifs.map(n => n.departmentId));

    for (const [deptId, data] of Object.entries(missingByDept)) {
      if (sentDeptIds.has(deptId)) continue; 
      
      let message = `ใกล้ถึงกำหนดเวลาบันทึกข้อมูล (วันที่ 25) พบว่ายังมีหมายเลขที่ยังไม่ได้บันทึกบิล ดังนี้:\n`;
      message += data.missingServices.join(', ');
      
      if (message.length > 500) message = message.substring(0, 497) + '...';

      await createNotification({
        departmentId: deptId,
        title: title,
        message: message,
        type: "MISSING_DATA",
        severity: "NORMAL",
        link: "/bills/new"
      });
    }
  }

  // 3. Pending Bills (Unpaid for >= 2 months from billing cycle)
  if (mode === "all" || mode === "daily") {
    // e.g., if current is Mar 2026 (Month 3), and bill is Jan 2026 (Month 1), 3 - 1 = 2 (triggers alert)
    const currentAbsoluteMonth = today.getFullYear() * 12 + (today.getMonth() + 1);
  
  const pendingBills = await db.select({
    id: utilityBills.id,
    departmentId: utilityBills.departmentId,
    utilityType: utilityBills.utilityType,
    billingMonth: utilityBills.billingMonth,
    billingYear: utilityBills.billingYear,
    serviceNumber: utilityBills.serviceNumber,
    departmentName: departments.fullName
  })
  .from(utilityBills)
  .leftJoin(departments, eq(utilityBills.departmentId, departments.id))
  .where(
    and(
      eq(utilityBills.paymentStatus, 'PENDING'),
      sql`${currentAbsoluteMonth} - (${utilityBills.billingYear} * 12 + ${utilityBills.billingMonth}) >= 2`
    )
  );

  const thMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  for (const bill of pendingBills) {
    const monthName = thMonths[bill.billingMonth - 1] || "";
    await createNotification({
      departmentId: bill.departmentId,
      title: "แจ้งเตือนหนี้ค้างชำระ",
      message: `[${bill.departmentName || 'ไม่ระบุหน่วยงาน'}] รายการ${bill.utilityType} (หมายเลขผู้ใช้: ${bill.serviceNumber || '-'}) ของรอบบิล ${monthName} ${bill.billingYear + 543} ยังไม่ได้ชำระเงิน (ค้างชำระเกิน 2 เดือน)`,
      type: "PENDING_BILL",
      severity: "URGENT",
      link: `/bills/${bill.id}/edit`
    });
  }

  // 4. Late Payment (Received status, no payment within 15 days)
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  const latePayments = await db.select({
    id: utilityBills.id,
    departmentId: utilityBills.departmentId,
    utilityType: utilityBills.utilityType,
    serviceNumber: utilityBills.serviceNumber,
    departmentName: departments.fullName
  })
  .from(utilityBills)
  .leftJoin(departments, eq(utilityBills.departmentId, departments.id))
  .where(
    and(
      eq(utilityBills.invoiceStatus, 'RECEIVED'),
      eq(utilityBills.paymentStatus, 'PENDING'),
      lte(utilityBills.receivedDate, fifteenDaysAgo)
    )
  );

  for (const bill of latePayments) {
    await createNotification({
      departmentId: bill.departmentId,
      title: "แจ้งเตือนการเบิกจ่ายล่าช้า",
      message: `[${bill.departmentName || 'ไม่ระบุหน่วยงาน'}] รายการ${bill.utilityType} (หมายเลขผู้ใช้: ${bill.serviceNumber || '-'}) ยังไม่มีการเบิกจ่าย (เกิน 15 วันหลังจากรับใบแจ้งหนี้)`,
      type: "LATE_PAYMENT",
      severity: "WARNING",
      link: `/bills/${bill.id}/edit`
    });
  }

  // 5. Abnormal Expense (> 30% increase from last month)
  // Simplified check: Just find all bills for the current month and compare to last month.
  // In a real scenario, this might need more robust aggregation per service number.
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  // We could do a complex SQL query, but for simplicity in this engine we'll do it in memory for recent bills
  const recentBills = await db.select({
    id: utilityBills.id,
    departmentId: utilityBills.departmentId,
    utilityType: utilityBills.utilityType,
    billingMonth: utilityBills.billingMonth,
    billingYear: utilityBills.billingYear,
    invoiceAmount: utilityBills.invoiceAmount,
    serviceNumber: utilityBills.serviceNumber,
    departmentName: departments.fullName
  })
  .from(utilityBills)
  .leftJoin(departments, eq(utilityBills.departmentId, departments.id))
  .where(
    or(
      and(eq(utilityBills.billingMonth, currentMonth), eq(utilityBills.billingYear, currentYear)),
      and(eq(utilityBills.billingMonth, lastMonth), eq(utilityBills.billingYear, lastMonthYear))
    )
  );

  // Group by department, utility type, and service number
  const grouped: Record<string, any> = {};
  for (const b of recentBills) {
    const key = `${b.departmentId}::${b.utilityType}::${b.serviceNumber || 'none'}`;
    if (!grouped[key]) grouped[key] = { current: 0, last: 0, departmentName: b.departmentName, currentBillId: null };
    if (b.billingMonth === currentMonth) {
      grouped[key].current += Number(b.invoiceAmount || 0);
      grouped[key].currentBillId = b.id;
    } else {
      grouped[key].last += Number(b.invoiceAmount || 0);
    }
  }

  for (const [key, amounts] of Object.entries(grouped)) {
    if (amounts.last > 0 && amounts.current > amounts.last * 1.3) {
      const [deptId, utilType, serviceNum] = key.split('::');
      await createNotification({
        departmentId: deptId,
        title: "แจ้งเตือนค่าใช้จ่ายสูงผิดปกติ",
        message: `[${amounts.departmentName || 'ไม่ระบุหน่วยงาน'}] ${utilType} (หมายเลขผู้ใช้: ${serviceNum === 'none' ? '-' : serviceNum}) ในเดือนนี้สูงกว่าเดือนที่แล้วมากกว่า 30%`,
        type: "ABNORMAL_EXPENSE",
        severity: "WARNING",
        link: amounts.currentBillId ? `/bills/${amounts.currentBillId}/edit` : "/reports/utility"
      });
    }
  }
  
  } // End daily checks

  return { success: true, message: "Notification engine executed successfully" };
}

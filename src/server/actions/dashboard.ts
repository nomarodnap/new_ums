"use server";

import { db } from "@/server/db";
import { utilityBills, departments, audits } from "@/server/db/schema";
import { eq, and, desc, sql, inArray, gte, lte } from "drizzle-orm";
import { requireRole } from "@/server/auth";

export async function getDashboardStats(
  scope: "department" | "all" = "department",
  targetDepartmentId?: string,
) {
  const session = await requireRole([
    "admin",
    "auditor",
    "strategy_finance",
    "central_staff",
    "regional_staff",
    "user",
  ]);

  const userRole = session.user.role as string;
  const userDepartmentId = session.user.departmentId;
  const isAdmin = [
    "admin",
    "auditor",
    "strategy_finance",
    "central_staff",
  ].includes(userRole);

  if (scope === "all" && !isAdmin) {
    throw new Error("ไม่มีสิทธิ์เข้าถึงแดชบอร์ดภาพรวม");
  }

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  let roleCondition = undefined;
  let departmentName: string | null = null;
  let departmentShortName: string | null = null;

  if (scope === "all") {
    roleCondition = undefined;
    departmentName = "ภาพรวมทุกหน่วยงาน (292 หน่วยงาน)";
  } else {
    let deptId =
      targetDepartmentId && isAdmin ? targetDepartmentId : userDepartmentId;

    if (!deptId && isAdmin) {
      const firstDept = await db
        .select({
          id: departments.id,
          fullName: departments.fullName,
          shortName: departments.shortName,
        })
        .from(departments)
        .limit(1);
      if (firstDept.length > 0) {
        deptId = firstDept[0].id;
        departmentName = firstDept[0].fullName;
        departmentShortName = firstDept[0].shortName;
      }
    } else if (deptId) {
      const dept = await db
        .select({
          fullName: departments.fullName,
          shortName: departments.shortName,
        })
        .from(departments)
        .where(eq(departments.id, deptId))
        .limit(1);
      if (dept.length > 0) {
        departmentName = dept[0].fullName;
        departmentShortName = dept[0].shortName;
      }
    }

    roleCondition = deptId ? eq(utilityBills.departmentId, deptId) : sql`1=0`;
  }

  // 1. Total Invoices Current Month
  const currentMonthCondition = and(
    eq(utilityBills.billingMonth, currentMonth),
    eq(utilityBills.billingYear, currentYear),
    roleCondition,
  );

  const currentMonthBills = await db
    .select({ count: sql<number>`count(*)` })
    .from(utilityBills)
    .where(currentMonthCondition);
  const totalInvoicesCurrentMonth = currentMonthBills[0]?.count || 0;

  // 2. Total Pending Bills (paymentStatus = 'PENDING')
  const pendingCondition = and(
    eq(utilityBills.paymentStatus, "PENDING"),
    roleCondition,
  );
  const pendingBillsRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(utilityBills)
    .where(pendingCondition);
  const totalPendingBills = pendingBillsRes[0]?.count || 0;

  // 3. Paid Amount Current Month
  const paidCondition = and(
    eq(utilityBills.paymentStatus, "PAID"),
    eq(utilityBills.billingMonth, currentMonth),
    eq(utilityBills.billingYear, currentYear),
    roleCondition,
  );
  const paidRes = await db
    .select({
      total: sql<number>`sum(COALESCE(${utilityBills.paidAmount}, 0))`,
    })
    .from(utilityBills)
    .where(paidCondition);
  const totalPaidCurrentMonth = Number(paidRes[0]?.total || 0);

  // 4. Anomalous Bills (Unreviewed / Manual flag or any audit issue)
  const anomalyCondition = and(
    sql`(${audits.isManualAnomaly} = true OR ${audits.isLateReceive} = true OR ${audits.isLatePayment} = true OR ${audits.isOverdueMoreThan2Months} = true OR ${audits.isDisbursementOver2Months} = true OR ${audits.isWrongMonth} = true OR ${audits.isPhoneOverLimit} = true OR ${audits.isPhoneUsageOverLimit} = true OR ${audits.isWrongBudget} = true OR ${audits.isDuplicate} = true)`,
    eq(utilityBills.isReviewed, false),
    roleCondition,
  );

  const anomalousBillsRes = await db
    .select({ count: sql<number>`count(DISTINCT ${utilityBills.id})` })
    .from(utilityBills)
    .leftJoin(audits, eq(utilityBills.id, audits.utilityBillId))
    .where(anomalyCondition);
  const totalAnomalies = anomalousBillsRes[0]?.count || 0;

  // 5. Recent Anomalies Details (Top 5)
  const recentAnomalies = await db
    .select({
      id: utilityBills.id,
      departmentName: departments.fullName,
      utilityType: utilityBills.utilityType,
      billingMonth: utilityBills.billingMonth,
      billingYear: utilityBills.billingYear,
      invoiceAmount: utilityBills.invoiceAmount,
      isManualAnomaly: audits.isManualAnomaly,
      manualAnomalyReason: audits.manualAnomalyReason,
      isLateReceive: audits.isLateReceive,
      isLatePayment: audits.isLatePayment,
      isOverdueMoreThan2Months: audits.isOverdueMoreThan2Months,
      isDisbursementOver2Months: audits.isDisbursementOver2Months,
    })
    .from(utilityBills)
    .leftJoin(departments, eq(utilityBills.departmentId, departments.id))
    .leftJoin(audits, eq(utilityBills.id, audits.utilityBillId))
    .where(anomalyCondition)
    .orderBy(desc(utilityBills.createdAt))
    .limit(5);

  // 6. Top 5 Departments Spending (Only for 'all' scope)
  let topDepartments: { name: string; amount: number }[] = [];
  if (scope === "all") {
    topDepartments = await db
      .select({
        name: departments.fullName,
        amount: sql<number>`sum(COALESCE(${utilityBills.paidAmount}, 0))`,
      })
      .from(utilityBills)
      .innerJoin(departments, eq(utilityBills.departmentId, departments.id))
      .where(eq(utilityBills.paymentStatus, "PAID"))
      .groupBy(departments.id, departments.fullName)
      .orderBy(desc(sql`sum(COALESCE(${utilityBills.paidAmount}, 0))`))
      .limit(5);
  }

  // 7. Trend Data (Last 12 Months)
  // We'll calculate the last 12 months in code, then query them.
  const trendData = [];
  const THAI_MONTHS = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];

  for (let i = 11; i >= 0; i--) {
    let m = currentMonth - i;
    let y = currentYear;
    if (m <= 0) {
      m += 12;
      y -= 1;
    }

    // Sum by utility type
    const monthRes = await db
      .select({
        utilityType: utilityBills.utilityType,
        total: sql<number>`sum(COALESCE(${utilityBills.paidAmount}, 0))`,
      })
      .from(utilityBills)
      .where(
        and(
          eq(utilityBills.billingMonth, m),
          eq(utilityBills.billingYear, y),
          eq(utilityBills.paymentStatus, "PAID"),
          roleCondition,
        ),
      )
      .groupBy(utilityBills.utilityType);

    let electricity = 0;
    let water = 0;
    let phone = 0;
    let telecom = 0;
    let postal = 0;

    monthRes.forEach((r) => {
      if (r.utilityType === "ค่าไฟฟ้า") electricity = Number(r.total);
      else if (r.utilityType === "ค่าประปา&น้ำบาดาล") water = Number(r.total);
      else if (r.utilityType === "ค่าโทรศัพท์") phone = Number(r.total);
      else if (r.utilityType === "ค่าสื่อสาร&โทรคมนาคม") telecom = Number(r.total);
      else if (r.utilityType === "ค่าบริการไปรษณีย์") postal = Number(r.total);
    });

    trendData.push({
      month: THAI_MONTHS[m - 1],
      electricity,
      water,
      phone,
      telecom,
      postal,
    });
  }

  // 8. Status Pie Chart
  const statusRes = await db
    .select({
      status: utilityBills.paymentStatus,
      count: sql<number>`count(*)`,
    })
    .from(utilityBills)
    .where(roleCondition)
    .groupBy(utilityBills.paymentStatus);

  let statusPaid = 0;
  let statusPending = 0;

  statusRes.forEach((r) => {
    if (r.status === "PAID") statusPaid = Number(r.count);
    if (r.status === "PENDING") statusPending = Number(r.count);
  });

  const statusData = [
    { name: "เบิกจ่ายแล้ว", value: statusPaid, color: "var(--chart-2)" },
    { name: "ค้างชำระ", value: statusPending, color: "var(--chart-4)" },
  ];

  return {
    scope,
    isAdmin,
    userRole,
    userDepartmentId,
    departmentName,
    departmentShortName,
    totalInvoicesCurrentMonth,
    totalPendingBills,
    totalPaidCurrentMonth,
    totalAnomalies,
    recentAnomalies,
    topDepartments,
    trendData,
    statusData,
  };
}

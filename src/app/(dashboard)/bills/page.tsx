import { buttonVariants } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { db } from "@/server/db";
import {
  utilityBills,
  departments,
  audits,
  departmentServices,
} from "@/server/db/schema";
import { eq, desc, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { BillsTable } from "./bills-table";
import { requireRole } from "@/server/auth";

export default async function BillsPage() {
  const session = await requireRole([
    "admin",
    "auditor",
    "strategy_finance",
    "central_staff",
    "regional_staff",
    "user",
  ]);
  const userRole = session.user.role;
  const userDepartmentId = session.user.departmentId as string | undefined;

  const depositUnits = alias(departments, "deposit_units");

  const conditions = userDepartmentId
    ? or(
        eq(utilityBills.departmentId, userDepartmentId),
        eq(utilityBills.depositUnitId, userDepartmentId),
      )
    : eq(utilityBills.id, "NONE");

  const [billsData, servicesData] = await Promise.all([
    db
      .select({
        id: utilityBills.id,
        billCode: utilityBills.billCode,
        departmentId: utilityBills.departmentId,
        utilityType: utilityBills.utilityType,
        billingMonth: utilityBills.billingMonth,
        billingYear: utilityBills.billingYear,
        invoiceAmount: utilityBills.invoiceAmount,
        usageAmount: utilityBills.usageAmount,
        paymentStatus: utilityBills.paymentStatus,
        auditStatus: audits.status,
        departmentName: departments.fullName,
        departmentShortName: departments.shortName,
        departmentCostCenter: departments.costCenterCode,
        departmentType: departments.type,
        isPendingBillOnly: utilityBills.isPendingBillOnly,
        depositUnitId: utilityBills.depositUnitId,
        depositUnitName: depositUnits.fullName,
        provider: utilityBills.provider,
        serviceNumber: utilityBills.serviceNumber,
        serviceBreakdown: utilityBills.serviceBreakdown,
        invoiceNumber: utilityBills.invoiceNumber,
        invoiceDate: utilityBills.invoiceDate,
        receivedDate: utilityBills.receivedDate,
        paymentDate: utilityBills.paymentDate,
        receiptPaymentDate: utilityBills.receiptPaymentDate,
        sentToDisbursingDate: utilityBills.sentToDisbursingDate,
        disbursingReceivedDate: utilityBills.disbursingReceivedDate,
        invoiceStatus: utilityBills.invoiceStatus,
        paidAmount: utilityBills.paidAmount,
        paymentDocNumber: utilityBills.paymentDocNumber,
        docType: utilityBills.docType,
        accountCode: utilityBills.accountCode,
        budgetCode: utilityBills.budgetCode,
        locationType: utilityBills.locationType,
        attachmentInvoice: utilityBills.attachmentInvoice,
        attachmentReceipt: utilityBills.attachmentReceipt,
        attachmentDirectPayment: utilityBills.attachmentDirectPayment,
        attachmentKtbReport: utilityBills.attachmentKtbReport,
        isLateReceive: audits.isLateReceive,

        isLatePayment: audits.isLatePayment,
        isOverdueMoreThan2Months: audits.isOverdueMoreThan2Months,
        isDisbursementOver2Months: audits.isDisbursementOver2Months,
        isWrongMonth: audits.isWrongMonth,
        isPhoneOverLimit: audits.isPhoneOverLimit,
        isPhoneUsageOverLimit: audits.isPhoneUsageOverLimit,
        isWrongBudget: audits.isWrongBudget,
        isDuplicate: audits.isDuplicate,
        isManualAnomaly: audits.isManualAnomaly,
        manualAnomalyReason: audits.manualAnomalyReason,
        isReviewed: utilityBills.isReviewed,
        reviewedBy: utilityBills.reviewedBy,
        reviewedAt: utilityBills.reviewedAt,
      })
      .from(utilityBills)
      .leftJoin(departments, eq(utilityBills.departmentId, departments.id))
      .leftJoin(
        depositUnits,
        or(
          eq(utilityBills.depositUnitId, depositUnits.id),
          eq(utilityBills.depositUnitId, depositUnits.fullName),
        ),
      )
      .leftJoin(audits, eq(utilityBills.id, audits.utilityBillId))
      .where(conditions)
      .orderBy(desc(utilityBills.createdAt))
      .limit(500),
    db.select().from(departmentServices),
  ]);

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">รายการค่าใช้จ่าย</h2>
          <p className="text-muted-foreground mt-1">
            จัดการและติดตามสถานะใบแจ้งหนี้ค่าสาธารณูปโภคของหน่วยงาน
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href="/bills/new"
            className={buttonVariants({ variant: "default" })}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            บันทึกค่าใช้จ่ายใหม่
          </Link>
        </div>
      </div>

      <BillsTable
        initialData={billsData}
        services={servicesData}
        showAuditStatus={true}
        userRole={userRole as string}
      />
    </div>
  );
}

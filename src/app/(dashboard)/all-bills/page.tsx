import { buttonVariants } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { db } from "@/server/db"
import { utilityBills, departments, audits } from "@/server/db/schema"
import { eq, desc, or } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { BillsTable } from "../bills/bills-table"
import { requireRole } from "@/server/auth"

export default async function AllBillsPage() {
  const session = await requireRole(["admin", "auditor", "strategy_finance"]);
  const userRole = session.user.role;
  
  const depositUnits = alias(departments, 'deposit_units');

  const billsData = await db
    .select({
      id: utilityBills.id,
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
      isWrongMonth: audits.isWrongMonth,
      isPhoneOverLimit: audits.isPhoneOverLimit,
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
    .leftJoin(depositUnits, or(
      eq(utilityBills.depositUnitId, depositUnits.id),
      eq(utilityBills.depositUnitId, depositUnits.fullName)
    ))
    .leftJoin(audits, eq(utilityBills.id, audits.utilityBillId))
    .orderBy(desc(utilityBills.createdAt))
    .limit(500);

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">รายงานค่าใช้จ่ายทั้งหมด (ทุกหน่วยงาน)</h2>
          <p className="text-muted-foreground mt-1">
            ดูและติดตามสถานะใบแจ้งหนี้ค่าสาธารณูปโภคของทุกหน่วยงานในระบบ
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/bills/new" className={buttonVariants({ variant: "default" })}>
            <PlusCircle className="mr-2 h-4 w-4" />
            บันทึกค่าใช้จ่ายใหม่
          </Link>
        </div>
      </div>
      
      <BillsTable initialData={billsData} showAuditStatus={true} userRole={session.user.role as string} />
    </div>
  )
}

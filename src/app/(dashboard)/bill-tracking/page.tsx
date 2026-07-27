import { db } from "@/server/db";
import { utilityBills, departments, departmentServices } from "@/server/db/schema";
import { eq, and, or, inArray, sql } from "drizzle-orm";
import { requireRole } from "@/server/auth";
import { TrackingDashboard } from "./tracking-dashboard";

export const metadata = {
  title: "ติดตามสถานะบิล | ระบบจัดการสาธารณูปโภค",
};

export default async function BillTrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const session = await requireRole(["admin", "auditor", "strategy_finance", "central_staff", "regional_staff"]);
  const userRole = session.user.role;
  const userDepartmentId = session.user.departmentId as string | undefined;

  const isGlobalView = userRole ? ["admin", "auditor", "strategy_finance"].includes(userRole) : false;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const month = params.month ? parseInt(params.month, 10) : currentMonth;
  const year = params.year ? parseInt(params.year, 10) : currentYear;

  // 1. ดึงข้อมูล department_services
  let servicesQuery = db.select({
    id: departmentServices.id,
    departmentId: departmentServices.departmentId,
    utilityType: departmentServices.utilityType,
    provider: departmentServices.provider,
    serviceNumber: departmentServices.serviceNumber,
    departmentName: departments.fullName,
  }).from(departmentServices)
    .leftJoin(departments, eq(departmentServices.departmentId, departments.id));

  if (!isGlobalView && userDepartmentId) {
    servicesQuery = servicesQuery.where(eq(departmentServices.departmentId, userDepartmentId)) as any;
  }

  const allServices = await servicesQuery;

  // 2. ดึงข้อมูล utility_bills ของเดือนนั้น
  let billsQuery = db.select({
    id: utilityBills.id,
    departmentId: utilityBills.departmentId,
    depositUnitId: utilityBills.depositUnitId,
    utilityType: utilityBills.utilityType,
    provider: utilityBills.provider,
    serviceNumber: utilityBills.serviceNumber,
    invoiceStatus: utilityBills.invoiceStatus,
    paymentStatus: utilityBills.paymentStatus,
    invoiceAmount: utilityBills.invoiceAmount,
    estimatedAmount: utilityBills.estimatedAmount,
    departmentName: departments.fullName,
  }).from(utilityBills)
    .leftJoin(departments, eq(utilityBills.departmentId, departments.id));

  const baseCondition = and(
    eq(utilityBills.billingMonth, month),
    eq(utilityBills.billingYear, year)
  );

  let finalBillsQuery;
  if (!isGlobalView && userDepartmentId) {
    finalBillsQuery = billsQuery.where(
      and(
        baseCondition,
        or(
          eq(utilityBills.departmentId, userDepartmentId),
          eq(utilityBills.depositUnitId, userDepartmentId)
        )
      )
    );
  } else {
    finalBillsQuery = billsQuery.where(baseCondition);
  }

  const bills = await finalBillsQuery;

  // Flatten bills by splitting comma-separated service numbers
  const flattenedBills = [];
  for (const b of bills) {
    if (b.serviceNumber && b.serviceNumber.includes(',')) {
      const nums = b.serviceNumber.split(',').map(s => s.trim()).filter(Boolean);
      for (const num of nums) {
        flattenedBills.push({ ...b, serviceNumber: num });
      }
    } else {
      flattenedBills.push(b);
    }
  }

  // 3. ประมวลผลรวมข้อมูลเข้าด้วยกัน (UNION เชิงตรรกะ)
  const trackingData: any[] = [];
  const processedFlattenedKeys = new Set<string>();

  for (const service of allServices) {
    const matchingBills = flattenedBills.filter(
      b => b.departmentId === service.departmentId && 
           b.utilityType === service.utilityType && 
           b.serviceNumber === service.serviceNumber
    );

    if (matchingBills.length > 0) {
      for (const bill of matchingBills) {
        processedFlattenedKeys.add(`${bill.id}-${bill.serviceNumber}`);
        
        let status = "UNKNOWN";
        if (bill.invoiceStatus === "NOT_RECEIVED") {
          status = "NOT_RECEIVED";
        } else if (bill.invoiceStatus === "RECEIVED" && bill.paymentStatus === "PENDING") {
          status = "PENDING_PAYMENT";
        } else if (bill.paymentStatus === "PAID") {
          status = "PAID";
        }

        trackingData.push({
          id: `bill-${bill.id}-${bill.serviceNumber}`,
          departmentId: bill.departmentId,
          departmentName: bill.departmentName || "ไม่ระบุหน่วยงาน",
          utilityType: bill.utilityType,
          provider: bill.provider || service.provider,
          serviceNumber: bill.serviceNumber || service.serviceNumber,
          amount: bill.invoiceAmount || bill.estimatedAmount || "0",
          status: status,
          isExpected: true,
          billId: bill.id,
        });
      }
    } else {
      trackingData.push({
        id: `service-${service.id}`,
        departmentId: service.departmentId,
        departmentName: service.departmentName || "ไม่ระบุหน่วยงาน",
        utilityType: service.utilityType,
        provider: service.provider,
        serviceNumber: service.serviceNumber,
        amount: "0",
        status: "UNRECORDED",
        isExpected: true,
        billId: null,
      });
    }
  }

  for (const bill of flattenedBills) {
    if (!processedFlattenedKeys.has(`${bill.id}-${bill.serviceNumber}`)) {
      let status = "UNKNOWN";
      if (bill.invoiceStatus === "NOT_RECEIVED") {
        status = "NOT_RECEIVED";
      } else if (bill.invoiceStatus === "RECEIVED" && bill.paymentStatus === "PENDING") {
        status = "PENDING_PAYMENT";
      } else if (bill.paymentStatus === "PAID") {
        status = "PAID";
      }

      trackingData.push({
        id: `bill-${bill.id}-${bill.serviceNumber}`,
        departmentId: bill.departmentId,
        departmentName: bill.departmentName || "ไม่ระบุหน่วยงาน",
        utilityType: bill.utilityType,
        provider: bill.provider || "-",
        serviceNumber: bill.serviceNumber || "-",
        amount: bill.invoiceAmount || bill.estimatedAmount || "0",
        status: status,
        isExpected: false,
        billId: bill.id,
      });
    }
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ติดตามสถานะบิล</h2>
          <p className="text-muted-foreground mt-1">
            ตรวจสอบความคืบหน้าการบันทึกและการชำระเงินค่าสาธารณูปโภคประจำเดือน
          </p>
        </div>
      </div>
      
      <TrackingDashboard 
        initialData={trackingData} 
        month={month} 
        year={year} 
      />
    </div>
  );
}

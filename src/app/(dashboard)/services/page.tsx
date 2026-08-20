import { Metadata } from "next";
import { requireRole } from "@/server/auth";
import { db } from "@/server/db";
import { departmentServices, departments } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { ServicesTable } from "./services-table";

export const metadata: Metadata = {
  title: "รหัสเครื่องวัด / เบอร์โทร",
};

export default async function ServicesPage() {
  const session = await requireRole([
    "admin",
    "central_staff",
    "regional_staff",
    "user",
  ]);

  // Fetch services and join with departments
  const allServicesData = await db
    .select({
      id: departmentServices.id,
      departmentId: departmentServices.departmentId,
      utilityType: departmentServices.utilityType,
      provider: departmentServices.provider,
      serviceNumber: departmentServices.serviceNumber,
      locationType: departmentServices.locationType,
      phoneOwnerName: departmentServices.phoneOwnerName,
      phoneOwnerPosition: departmentServices.phoneOwnerPosition,
      phoneReimbursementLimit: departmentServices.phoneReimbursementLimit,
      departmentName: departments.fullName,
    })
    .from(departmentServices)
    .leftJoin(departments, eq(departmentServices.departmentId, departments.id));

  // Filter based on role
  const services =
    session.user.role === "admin"
      ? allServicesData
      : allServicesData.filter(
          (s) => s.departmentId === session.user.departmentId,
        );

  // Get departments for the form dropdown (Admin sees all, others see own)
  const allDepartmentsData = await db
    .select({
      id: departments.id,
      fullName: departments.fullName,
      shortName: departments.shortName,
    })
    .from(departments);

  const allowedDepartments =
    session.user.role === "admin"
      ? allDepartmentsData
      : allDepartmentsData.filter((d) => d.id === session.user.departmentId);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          รหัสเครื่องวัด / เบอร์โทร
        </h2>
      </div>
      <p className="text-muted-foreground">
        จัดการข้อมูลบัญชีผู้ให้บริการสาธารณูปโภค หมายเลขผู้ใช้ รหัสเครื่องวัด
        และเบอร์โทรศัพท์ของหน่วยงาน
      </p>

      <ServicesTable
        services={services}
        departments={allowedDepartments}
        userRole={session.user.role as string}
        userDepartmentId={session.user.departmentId || null}
      />
    </div>
  );
}

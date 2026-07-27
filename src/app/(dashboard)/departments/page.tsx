import { db } from "@/server/db";
import { departments, user, departmentServices } from "@/server/db/schema";
import { desc } from "drizzle-orm";
import { requireRole } from "@/server/auth";
import { DepartmentsTable } from "./departments-table";
import { DepartmentFormSheet } from "./department-form-sheet";

export default async function DepartmentsPage() {
  await requireRole(["admin", "central_staff", "regional_staff"]);

  const allDepartments = await db.select().from(departments).orderBy(desc(departments.createdAt));
  const allUsers = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    role: user.role,
    banned: user.banned,
    departmentId: user.departmentId,
    phone: user.phone,
  }).from(user);

  const allServices = await db.select().from(departmentServices);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">หน่วยงาน (Departments)</h1>
          <p className="text-muted-foreground mt-2">
            จัดการข้อมูลหน่วยงาน 292 หน่วยงาน (ส่วนกลางและภูมิภาค)
          </p>
        </div>
        <DepartmentFormSheet departments={allDepartments} />
      </div>

      <DepartmentsTable initialData={allDepartments} users={allUsers} services={allServices} />
    </div>
  );
}

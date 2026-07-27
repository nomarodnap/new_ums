import { db } from "@/server/db"
import { departments, departmentServices, user } from "@/server/db/schema"
import { CreateBillForm } from "@/components/bills/create-bill-form"
import { requireRole } from "@/server/auth"
import { eq } from "drizzle-orm"

export default async function NewBillPage() {
  const session = await requireRole(["admin", "central_staff", "regional_staff", "user"]);
  
  const allDepartments = await db.select().from(departments).orderBy(departments.fullName);
  const allServices = await db.select().from(departmentServices);
  
  const currentUser = await db.select({ departmentId: user.departmentId }).from(user).where(eq(user.id, session.user.id)).limit(1);
  const defaultDepartmentId = currentUser[0]?.departmentId || undefined;

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">เพิ่มรายการใหม่</h2>
      </div>
      <CreateBillForm departments={allDepartments} services={allServices} defaultDepartmentId={defaultDepartmentId} />
    </div>
  )
}

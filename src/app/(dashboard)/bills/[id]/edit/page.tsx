import { db } from "@/server/db"
import { departments, departmentServices, utilityBills } from "@/server/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { EditBillForm } from "@/components/bills/edit-bill-form"

export default async function EditBillPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const bill = await db.query.utilityBills.findFirst({
    where: eq(utilityBills.id, resolvedParams.id)
  });

  if (!bill) {
    notFound();
  }

  const allDepartments = await db.select().from(departments).orderBy(departments.fullName);
  const allServices = await db.select().from(departmentServices);

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">อัพเดทรายการค่าใช้จ่าย</h2>
      </div>
      <EditBillForm 
        departments={allDepartments} 
        services={allServices} 
        initialData={bill}
      />
    </div>
  )
}

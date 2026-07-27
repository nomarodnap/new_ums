"use client";

import { useState, useActionState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDepartment, updateDepartment } from "@/server/actions/departments";
import { PlusCircle } from "lucide-react";
import { DepartmentCombobox } from "@/components/ui/department-combobox";

// @ts-ignore
export function DepartmentFormSheet({ 
  department, 
  departments = [],
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: { 
  department?: any, 
  departments?: any[],
  trigger?: React.ReactElement,
  open?: boolean,
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled && controlledOnOpenChange ? controlledOnOpenChange : setInternalOpen;

  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    
    let res;
    if (department?.id) {
      res = await updateDepartment(department.id, formData);
    } else {
      res = await createDepartment(formData);
    }

    setIsPending(false);

    if (res?.error) {
        if (typeof res.error === 'object') {
            setErrors(res.error as Record<string, string[]>);
        } else {
            alert(res.error);
        }
    } else if (res?.success) {
      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ? (
        !isControlled && <SheetTrigger render={trigger} nativeButton={false} />
      ) : (
        !isControlled && <SheetTrigger render={<Button><PlusCircle className="mr-2 h-4 w-4" /> เพิ่มหน่วยงาน</Button>} />
      )}
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{department ? "แก้ไขข้อมูลหน่วยงาน" : "เพิ่มหน่วยงานใหม่"}</SheetTitle>
          <SheetDescription>
            กรอกข้อมูลรายละเอียดของหน่วยงาน
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="costCenterCode" className="text-sm font-medium">รหัสศูนย์ต้นทุน</label>
              <Input id="costCenterCode" name="costCenterCode" defaultValue={department?.costCenterCode || ""} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="type" className="text-sm font-medium">ประเภทหน่วยงาน</label>
              <select 
                id="type" 
                name="type" 
                defaultValue={department?.type || ""} 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">-- เลือกประเภท --</option>
                <option value="central">ส่วนกลาง</option>
                <option value="regional_central">ส่วนกลางในภูมิภาค</option>
                <option value="regional">ส่วนภูมิภาค</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label htmlFor="fullName" className="text-sm font-medium text-red-500">ชื่อหน่วยงาน (เต็ม) *</label>
            <Input id="fullName" name="fullName" defaultValue={department?.fullName || ""} required />
            {errors?.fullName && <span className="text-xs text-red-500">{errors.fullName[0]}</span>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="shortName" className="text-sm font-medium">ชื่อย่อ</label>
              <Input id="shortName" name="shortName" defaultValue={department?.shortName || ""} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="province" className="text-sm font-medium">จังหวัด</label>
              <Input id="province" name="province" defaultValue={department?.province || ""} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="disbursingUnit" className="text-sm font-medium">หน่วยเบิกจ่าย</label>
              <Input id="disbursingUnit" name="disbursingUnit" defaultValue={department?.disbursingUnit || ""} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="depositUnit" className="text-sm font-medium">รหัสหน่วยรับฝาก</label>
              <DepartmentCombobox 
                departments={departments}
                name="depositUnit"
                value={department?.depositUnit || ""}
                placeholder="ระบุหน่วยรับฝาก"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="text-sm font-medium">เบอร์โทรศัพท์ (สำนักงาน)</label>
              <Input id="phone" name="phone" defaultValue={department?.phone || ""} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">อีเมล</label>
              <Input id="email" name="email" type="email" defaultValue={department?.email || ""} />
              {errors?.email && <span className="text-xs text-red-500">{errors.email[0]}</span>}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label htmlFor="responsiblePerson" className="text-sm font-medium">ผู้รับผิดชอบ</label>
            <Input id="responsiblePerson" name="responsiblePerson" defaultValue={department?.responsiblePerson || ""} />
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DepartmentCombobox } from "@/components/ui/department-combobox";
import { updateUserAdmin } from "@/server/actions/users";

export function UserFormSheet({
  user,
  department,
  departments = [],
  open,
  onOpenChange,
}: {
  user: any;
  department: any;
  departments?: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    user.departmentId || department?.id || "",
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      role: formData.get("role") as string,
      departmentId: selectedDepartmentId,
      phone: formData.get("phone") as string,
    };

    const res = await updateUserAdmin(user.id, data);

    setIsPending(false);

    if (res?.error) {
      alert(res.error);
    } else if (res?.success) {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>แก้ไขข้อมูลผู้ใช้</SheetTitle>
          <SheetDescription>
            แก้ไขข้อมูลสำหรับ {user.name} ({user.email})
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">
              สังกัดหน่วยงาน <span className="text-destructive">*</span>
            </label>
            <DepartmentCombobox
              departments={departments}
              name="departmentId"
              value={selectedDepartmentId}
              onValueChange={setSelectedDepartmentId}
              placeholder="เลือกสังกัดหน่วยงาน..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="role" className="text-sm font-medium">
              สิทธิ์การใช้งาน (Role)
            </label>
            <select
              id="role"
              name="role"
              defaultValue={user.role || "user"}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="user">ผู้ใช้งานทั่วไป (User)</option>
              <option value="admin">ผู้ดูแลระบบ (Admin)</option>
              {/* <option value="auditor">ตรวจสอบภายใน (Auditor)</option>
              <option value="strategy_finance">กยผ. และ กค. (Strategy & Finance)</option>*/}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="phone" className="text-sm font-medium">
              เบอร์โทรศัพท์
            </label>
            <Input id="phone" name="phone" defaultValue={user.phone || ""} />
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

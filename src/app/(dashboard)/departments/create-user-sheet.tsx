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
import { createUserAdmin } from "@/server/actions/users";

export function CreateUserSheet({
  department,
  departments = [],
  open,
  onOpenChange,
}: {
  department: any;
  departments?: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    department?.id || "",
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as string,
      departmentId: selectedDepartmentId || department.id,
      phone: formData.get("phone") as string,
    };

    const res = await createUserAdmin(data);

    setIsPending(false);

    if (res?.error) {
      alert(res.error);
    } else if (res?.success) {
      alert(
        "เพิ่มบัญชีผู้ใช้งานสำเร็จ! ระบบได้ส่งอีเมลสำหรับตั้งรหัสผ่านไปยังผู้ใช้งานเรียบร้อยแล้ว (สถานะจะแสดง 'รอยืนยันอีเมล์' จนกว่าผู้ใช้งานจะตั้งรหัสผ่าน)",
      );
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>เพิ่มบัญชีผู้ใช้งานใหม่</SheetTitle>
          <SheetDescription>
            สร้างบัญชีผู้ใช้งานสำหรับ {department.fullName}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              ชื่อ-นามสกุล <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              name="name"
              required
              placeholder="เช่น นายประมง รักษ์น้ำ"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium">
              อีเมล (ใช้สำหรับเข้าสู่ระบบ) <span className="text-destructive">*</span>
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="email@fisheries.go.th"
            />
          </div>

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
              สิทธิ์การใช้งาน (Role) <span className="text-destructive">*</span>
            </label>
            <select
              id="role"
              name="role"
              defaultValue="user"
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
            <Input id="phone" name="phone" placeholder="02-XXX-XXXX" />
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
              {isPending ? "กำลังบันทึก..." : "เพิ่มบัญชี"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createBudgetCode,
  updateBudgetCode,
} from "@/server/actions/budget-codes";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export type BudgetCodeItem = {
  id: string;
  code: string;
  name: string;
  fiscalYear: number;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function BudgetCodeDialog({
  open,
  onOpenChange,
  budgetCodeToEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetCodeToEdit?: BudgetCodeItem | null;
}) {
  const router = useRouter();
  const currentBE = new Date().getFullYear() + 543;
  const currentFiscalYear =
    new Date().getMonth() >= 9 ? currentBE + 1 : currentBE;

  const [fiscalYear, setFiscalYear] = useState<string>(
    String(budgetCodeToEdit?.fiscalYear || currentFiscalYear),
  );
  const [isActive, setIsActive] = useState<boolean>(
    budgetCodeToEdit ? budgetCodeToEdit.isActive : true,
  );

  const action = budgetCodeToEdit
    ? updateBudgetCode.bind(null, budgetCodeToEdit.id)
    : createBudgetCode;

  const [state, formAction, isPending] = useActionState(action, {
    success: false,
  });

  useEffect(() => {
    if (budgetCodeToEdit) {
      setFiscalYear(String(budgetCodeToEdit.fiscalYear));
      setIsActive(budgetCodeToEdit.isActive);
    } else {
      setFiscalYear(String(currentFiscalYear));
      setIsActive(true);
    }
  }, [budgetCodeToEdit, open, currentFiscalYear]);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message || "บันทึกสำเร็จ");
      onOpenChange(false);
      router.refresh();
    } else if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, onOpenChange, router]);

  const yearOptions = [
    currentFiscalYear + 1,
    currentFiscalYear,
    currentFiscalYear - 1,
    currentFiscalYear - 2,
    currentFiscalYear - 3,
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>
            {budgetCodeToEdit ? "แก้ไขรหัสงบประมาณ" : "เพิ่มรหัสงบประมาณใหม่"}
          </DialogTitle>
          <DialogDescription>
            กำหนดรหัสงบประมาณประจำปี สำหรับใช้ในระบบเบิกจ่ายค่าสาธารณูปโภค
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 py-2">
          <input
            type="hidden"
            name="isActive"
            value={isActive ? "true" : "false"}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fiscalYear">
                ปีงบประมาณ (พ.ศ.) <span className="text-destructive">*</span>
              </Label>
              <Select
                value={fiscalYear}
                onValueChange={(val) => val && setFiscalYear(val)}
                name="fiscalYear"
              >
                <SelectTrigger id="fiscalYear" className="w-full">
                  <SelectValue placeholder="เลือกปีงบประมาณ">
                    {fiscalYear ? `พ.ศ. ${fiscalYear}` : "เลือกปีงบประมาณ"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((yr) => (
                    <SelectItem key={yr} value={String(yr)}>
                      พ.ศ. {yr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.fieldErrors?.fiscalYear && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.fiscalYear[0]}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="code">
                รหัสงบประมาณ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                name="code"
                defaultValue={budgetCodeToEdit?.code || ""}
                placeholder="เช่น 2800100000000000"
                required
              />
              {state.fieldErrors?.code && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.code[0]}
                </p>
              )}
            </div>
          </div>

          {/* Name field hidden as per user request */}
          <input
            type="hidden"
            name="name"
            value={budgetCodeToEdit?.name || ""}
          />

          <div className="grid gap-2">
            <Label htmlFor="description">คำอธิบายเพิ่มเติม / หมายเหตุ</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={budgetCodeToEdit?.description || ""}
              placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div>
              <Label className="text-sm font-medium">สถานะการใช้งาน</Label>
              <p className="text-xs text-muted-foreground">
                เปิดเพื่อให้สามารถเลือกใช้งานในแบบฟอร์มบันทึกค่าใช้จ่ายได้
              </p>
            </div>
            <Button
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setIsActive(!isActive)}
            >
              {isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
            </Button>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "กำลังบันทึก..."
                : budgetCodeToEdit
                  ? "บันทึกการแก้ไข"
                  : "เพิ่มรหัสงบประมาณ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

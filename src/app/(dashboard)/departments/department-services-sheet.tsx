"use client";

import { useActionState, useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { addDepartmentService, deleteDepartmentService } from "@/server/actions/department-services";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";

type Service = {
  id: string;
  departmentId: string;
  utilityType: string;
  provider: string;
  serviceNumber: string;
  locationType: string | null;
  phoneOwnerName: string | null;
  phoneOwnerPosition: string | null;
  phoneReimbursementLimit: number | null;
};

export function DepartmentServicesSheet({
  department,
  services,
  open,
  onOpenChange,
}: {
  department?: any;
  services: Service[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, isPending] = useActionState(addDepartmentService, null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [utilityType, setUtilityType] = useState<string>("");
  const [phoneType, setPhoneType] = useState<string>("mobile");

  const handleDelete = async (id: string) => {
    if (confirm("ยืนยันการลบหมายเลขผู้ใช้นี้?")) {
      setIsDeleting(id);
      await deleteDepartmentService(id);
      setIsDeleting(null);
    }
  };

  const fieldErrors = typeof state?.error === "object" ? state.error : {};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>จัดการหมายเลขผู้ใช้</SheetTitle>
          <SheetDescription>
            {department?.fullName}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>รหัสเครื่องวัด</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      ไม่มีข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((svc) => (
                    <TableRow key={svc.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{svc.utilityType}</span>
                          <span className="text-xs text-muted-foreground">{svc.provider}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{svc.serviceNumber}</span>
                          {svc.locationType && <span className="text-xs text-muted-foreground">{svc.locationType}</span>}
                          {svc.utilityType === 'ค่าโทรศัพท์' && svc.phoneOwnerName && (
                            <span className="text-xs text-muted-foreground mt-1">
                              {svc.phoneOwnerName} ({svc.phoneOwnerPosition}) - สิทธิ {svc.phoneReimbursementLimit} บาท
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive" 
                          onClick={() => handleDelete(svc.id)}
                          disabled={isDeleting === svc.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">เพิ่มหมายเลขผู้ใช้ใหม่</h4>
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="departmentId" value={department?.id || ""} />
              
              {state?.error && typeof state.error === 'string' && (
                <div className="text-sm text-destructive">{state.error}</div>
              )}

              <div className="grid gap-2">
                <Label>ประเภทสาธารณูปโภค <span className="text-destructive">*</span></Label>
                <Select name="utilityType" onValueChange={(v: string | null) => { if (v) setUtilityType(v) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภท..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ค่าไฟฟ้า">ค่าไฟฟ้า</SelectItem>
                    <SelectItem value="ค่าประปา&น้ำบาดาล">ค่าประปา&น้ำบาดาล</SelectItem>
                    <SelectItem value="ค่าโทรศัพท์">ค่าโทรศัพท์</SelectItem>
                    <SelectItem value="ค่าสื่อสาร&โทรคมนาคม">ค่าสื่อสาร&โทรคมนาคม</SelectItem>
                    <SelectItem value="ค่าบริการไปรษณีย์">ค่าบริการไปรษณีย์</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors?.utilityType && <p className="text-xs text-destructive">{fieldErrors.utilityType[0]}</p>}
              </div>

              {utilityType === "ค่าโทรศัพท์" && (
                <div className="grid gap-2 pt-2 pb-2 border-y">
                  <Label>ประเภทโทรศัพท์</Label>
                  <input type="hidden" name="phoneType" value={phoneType} />
                  <RadioGroup 
                    value={phoneType} 
                    onValueChange={setPhoneType}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mobile" id="phone-mobile" />
                      <Label htmlFor="phone-mobile">โทรศัพท์มือถือ</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="home" id="phone-home" />
                      <Label htmlFor="phone-home">โทรศัพท์บ้าน</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <div className="grid gap-2">
                <Label>ผู้ให้บริการ <span className="text-destructive">*</span></Label>
                <Input name="provider" placeholder="เช่น กฟภ., TOT" />
                {fieldErrors?.provider && <p className="text-xs text-destructive">{fieldErrors.provider[0]}</p>}
              </div>

              <div className="grid gap-2">
                <Label>หมายเลขผู้ใช้ / รหัสเครื่องวัด <span className="text-destructive">*</span></Label>
                <Input name="serviceNumber" placeholder="หมายเลขเครื่องวัด" />
                {fieldErrors?.serviceNumber && <p className="text-xs text-destructive">{fieldErrors.serviceNumber[0]}</p>}
              </div>

              {(!["ค่าไปรษณีย์", "ค่าบริการไปรษณีย์"].includes(utilityType) && (utilityType !== "ค่าโทรศัพท์" || phoneType === "home")) && (
                <div className="grid gap-2">
                  <Label>ที่ตั้ง (ถ้ามี)</Label>
                  <Select name="locationType">
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกที่ตั้ง..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="สำนักงาน">สำนักงาน</SelectItem>
                      <SelectItem value="บ่อเพาะ">บ่อเพาะ</SelectItem>
                      <SelectItem value="บ้านพัก">บ้านพัก</SelectItem>
                      <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {utilityType === "ค่าโทรศัพท์" && phoneType === "mobile" && (
                <>
                  <div className="grid gap-2">
                        <Label>ชื่อ-สกุลเจ้าของเบอร์ <span className="text-destructive">*</span></Label>
                        <Input name="phoneOwnerName" placeholder="ระบุชื่อ-สกุล" />
                        {fieldErrors?.phoneOwnerName && <p className="text-xs text-destructive">{fieldErrors.phoneOwnerName[0]}</p>}
                      </div>
                      <div className="grid gap-2">
                        <Label>ตำแหน่งเจ้าของเบอร์ <span className="text-destructive">*</span></Label>
                        <Input name="phoneOwnerPosition" placeholder="ระบุตำแหน่ง" />
                        {fieldErrors?.phoneOwnerPosition && <p className="text-xs text-destructive">{fieldErrors.phoneOwnerPosition[0]}</p>}
                      </div>
                    </>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "กำลังบันทึก..." : "บันทึกหมายเลขผู้ใช้"}
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

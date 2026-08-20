"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  addDepartmentService,
  updateDepartmentService,
} from "@/server/actions/department-services";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Service = {
  id: string;
  departmentId: string;
  departmentName?: string | null;
  utilityType: string;
  provider: string;
  serviceNumber: string;
  locationType: string | null;
  phoneOwnerName: string | null;
  phoneOwnerPosition: string | null;
  phoneReimbursementLimit: number | null;
};

type Department = {
  id: string;
  fullName: string;
  shortName: string | null;
};

export function ServiceFormSheet({
  open,
  onOpenChange,
  departments,
  userRole,
  userDepartmentId,
  serviceToEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: Department[];
  userRole: string;
  userDepartmentId: string | null;
  serviceToEdit?: Service | null;
}) {
  const router = useRouter();

  const defaultDepartmentId =
    userRole === "admin" ? "" : userDepartmentId || "";
  const [departmentId, setDepartmentId] = useState<string>(
    serviceToEdit?.departmentId || defaultDepartmentId,
  );
  const [utilityType, setUtilityType] = useState<string>(
    serviceToEdit?.utilityType || "",
  );
  const [locationType, setLocationType] = useState<string>(
    serviceToEdit?.locationType || "",
  );
  const [phoneType, setPhoneType] = useState<string>(
    serviceToEdit
      ? serviceToEdit.phoneOwnerName
        ? "mobile"
        : "home"
      : "mobile",
  );
  const [phoneReimbursementLimit, setPhoneReimbursementLimit] =
    useState<string>(
      serviceToEdit?.phoneReimbursementLimit
        ? serviceToEdit.phoneReimbursementLimit.toString()
        : "1000",
    );

  // Use bound action if editing
  const action = serviceToEdit
    ? updateDepartmentService.bind(null, serviceToEdit.id)
    : addDepartmentService;

  const [state, formAction, isPending] = useActionState(action, null);
  const fieldErrors = typeof state?.error === "object" ? state.error : {};

  // Reset states when opened with new serviceToEdit
  useEffect(() => {
    if (open) {
      setDepartmentId(serviceToEdit?.departmentId || defaultDepartmentId);
      setUtilityType(serviceToEdit?.utilityType || "");
      setLocationType(serviceToEdit?.locationType || "");
      setPhoneType(
        serviceToEdit
          ? serviceToEdit.phoneOwnerName
            ? "mobile"
            : "home"
          : "mobile",
      );
      setPhoneReimbursementLimit(
        serviceToEdit?.phoneReimbursementLimit
          ? serviceToEdit.phoneReimbursementLimit.toString()
          : "1000",
      );
    }
  }, [open, serviceToEdit, defaultDepartmentId]);

  useEffect(() => {
    if (state?.success) {
      toast.success("บันทึกข้อมูลสำเร็จ");
      onOpenChange(false);
      router.refresh();
    } else if (state?.error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  }, [state, onOpenChange, router]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {serviceToEdit ? "แก้ไขรายการ" : "เพิ่มรหัสเครื่องวัด / เบอร์โทร"}
          </SheetTitle>
          <SheetDescription>
            {serviceToEdit
              ? "แก้ไขข้อมูลบัญชีผู้ให้บริการ หรือรหัสเครื่องวัด"
              : "ระบุข้อมูลบัญชีผู้ให้บริการ หรือรหัสเครื่องวัดของหน่วยงาน"}
          </SheetDescription>
        </SheetHeader>

        <form action={formAction} className="space-y-6 mt-6">
          <div className="space-y-4">
            {userRole === "admin" ? (
              <div className="space-y-2">
                <Label htmlFor="departmentId">
                  หน่วยงาน <span className="text-red-500">*</span>
                </Label>
                <Select
                  name="departmentId"
                  required
                  value={departmentId}
                  onValueChange={(v) => v && setDepartmentId(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกหน่วยงาน">
                      {departmentId
                        ? departments.find((d) => d.id === departmentId)
                            ?.shortName ||
                          departments.find((d) => d.id === departmentId)
                            ?.fullName
                        : "เลือกหน่วยงาน"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.shortName || dept.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors?.departmentId && (
                  <p className="text-sm text-red-500">
                    {fieldErrors.departmentId[0]}
                  </p>
                )}
              </div>
            ) : (
              <input
                type="hidden"
                name="departmentId"
                value={defaultDepartmentId}
              />
            )}

            <div className="space-y-2">
              <Label htmlFor="utilityType">
                ประเภทสาธารณูปโภค <span className="text-red-500">*</span>
              </Label>
              <Select
                name="utilityType"
                value={utilityType}
                onValueChange={(v) => v && setUtilityType(v)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภท">
                    {utilityType || "เลือกประเภท"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ค่าไฟฟ้า">ค่าไฟฟ้า</SelectItem>
                  <SelectItem value="ค่าน้ำประปา">ค่าน้ำประปา</SelectItem>
                  <SelectItem value="ค่าโทรศัพท์">ค่าโทรศัพท์</SelectItem>
                  <SelectItem value="ค่าอินเทอร์เน็ต">ค่าอินเทอร์เน็ต</SelectItem>
                  <SelectItem value="ค่าไปรษณีย์">ค่าไปรษณีย์</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors?.utilityType && (
                <p className="text-sm text-red-500">
                  {fieldErrors.utilityType[0]}
                </p>
              )}
            </div>

            {utilityType === "ค่าโทรศัพท์" && (
              <div className="space-y-2">
                <Label>ประเภทโทรศัพท์</Label>
                <input type="hidden" name="phoneType" value={phoneType} />
                <RadioGroup
                  value={phoneType}
                  onValueChange={setPhoneType}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mobile" id="edit-phone-mobile" />
                    <Label htmlFor="edit-phone-mobile">โทรศัพท์มือถือ</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="home" id="edit-phone-home" />
                    <Label htmlFor="edit-phone-home">โทรศัพท์บ้าน</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="provider">
                ผู้ให้บริการ <span className="text-red-500">*</span>
              </Label>
              <Input
                name="provider"
                defaultValue={serviceToEdit?.provider || ""}
                placeholder="เช่น กฟภ., กปภ., TOT, AIS"
                required
              />
              {fieldErrors?.provider && (
                <p className="text-sm text-red-500">
                  {fieldErrors.provider[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceNumber">
                รหัสเครื่องวัด / หมายเลขผู้ใช้ <span className="text-red-500">*</span>
              </Label>
              <Input
                name="serviceNumber"
                defaultValue={serviceToEdit?.serviceNumber || ""}
                placeholder="ระบุหมายเลข"
                required
              />
              {fieldErrors?.serviceNumber && (
                <p className="text-sm text-red-500">
                  {fieldErrors.serviceNumber[0]}
                </p>
              )}
            </div>

            {!["ค่าไปรษณีย์", "ค่าบริการไปรษณีย์"].includes(utilityType) &&
            (utilityType !== "ค่าโทรศัพท์" || phoneType === "home") ? (
              <div className="space-y-2 pt-2">
                <Label htmlFor="locationType">ประเภทสถานที่ / ที่ตั้ง</Label>
                <Select
                  name="locationType"
                  value={locationType}
                  onValueChange={(v) => v && setLocationType(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภทสถานที่ (ถ้ามี)">
                      {locationType || "เลือกประเภทสถานที่ (ถ้ามี)"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="สำนักงาน">สำนักงาน</SelectItem>
                    <SelectItem value="บ่อเพาะ">บ่อเพาะ</SelectItem>
                    <SelectItem value="บ้านพัก">บ้านพัก</SelectItem>
                    <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {utilityType === "ค่าโทรศัพท์" && phoneType === "mobile" && (
              <div className="space-y-4 pt-4 border-t">
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phoneOwnerName">
                      ชื่อ-สกุล <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="phoneOwnerName"
                      defaultValue={serviceToEdit?.phoneOwnerName || ""}
                      placeholder="ระบุชื่อ-สกุลผู้ถือครอง"
                    />
                    {fieldErrors?.phoneOwnerName && (
                      <p className="text-sm text-red-500">
                        {fieldErrors.phoneOwnerName[0]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneOwnerPosition">
                      ตำแหน่ง <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="phoneOwnerPosition"
                      defaultValue={serviceToEdit?.phoneOwnerPosition || ""}
                      placeholder="ระบุตำแหน่ง"
                    />
                    {fieldErrors?.phoneOwnerPosition && (
                      <p className="text-sm text-red-500">
                        {fieldErrors.phoneOwnerPosition[0]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneReimbursementLimit">
                      เพดานสิทธิเบิก (บาท/เดือน){" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      name="phoneReimbursementLimit"
                      value={phoneReimbursementLimit}
                      onValueChange={(v) => v && setPhoneReimbursementLimit(v)}
                      disabled={userRole === "user"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกเพดานการเบิก">
                          {phoneReimbursementLimit
                            ? `${Number(phoneReimbursementLimit).toLocaleString()} บาท`
                            : "เลือกเพดานการเบิก"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1000">1,000 บาท</SelectItem>
                        <SelectItem value="2000">2,000 บาท</SelectItem>
                        <SelectItem value="4000">4,000 บาท</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldErrors?.phoneReimbursementLimit && (
                      <p className="text-sm text-red-500">
                        {fieldErrors.phoneReimbursementLimit[0]}
                      </p>
                    )}
                  </div>
                </>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
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

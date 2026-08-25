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
import { ErrorSpeechBubble } from "@/components/ui/error-speech-bubble";
import { cn } from "@/lib/utils";
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

        <form noValidate action={formAction} className="space-y-6 mt-6">
          <div className="space-y-4">
            {userRole === "admin" ? (
              <div className="space-y-2 relative">
                <Label htmlFor="departmentId">
                  หน่วยงาน <span className="text-destructive">*</span>
                </Label>
                <Select
                  name="departmentId"
                  value={departmentId}
                  onValueChange={(v) => v && setDepartmentId(v)}
                >
                  <SelectTrigger className={fieldErrors?.departmentId ? "border-rose-500 ring-2 ring-rose-500/20" : ""}>
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
                <ErrorSpeechBubble message={fieldErrors?.departmentId} />
              </div>
            ) : (
              <input
                type="hidden"
                name="departmentId"
                value={defaultDepartmentId}
              />
            )}

            <div className="space-y-2 relative">
              <Label htmlFor="utilityType">
                ประเภทสาธารณูปโภค <span className="text-destructive">*</span>
              </Label>
              <Select
                name="utilityType"
                value={utilityType}
                onValueChange={(v) => v && setUtilityType(v)}
              >
                <SelectTrigger className={fieldErrors?.utilityType ? "border-rose-500 ring-2 ring-rose-500/20" : ""}>
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
              <ErrorSpeechBubble message={fieldErrors?.utilityType} />
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

            <div className="space-y-2 relative">
              <Label htmlFor="provider">
                ผู้ให้บริการ <span className="text-destructive">*</span>
              </Label>
              <Input
                name="provider"
                defaultValue={serviceToEdit?.provider || ""}
                placeholder="เช่น กฟภ., กปภ., TOT, AIS"
                className={fieldErrors?.provider ? "border-rose-500 ring-2 ring-rose-500/20" : ""}
              />
              <ErrorSpeechBubble message={fieldErrors?.provider} />
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="serviceNumber">
                รหัสเครื่องวัด / หมายเลขผู้ใช้ <span className="text-destructive">*</span>
              </Label>
              <Input
                name="serviceNumber"
                defaultValue={serviceToEdit?.serviceNumber || ""}
                placeholder="ระบุหมายเลข"
                className={fieldErrors?.serviceNumber ? "border-rose-500 ring-2 ring-rose-500/20" : ""}
              />
              <ErrorSpeechBubble message={fieldErrors?.serviceNumber} />
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
                  <div className="space-y-2 relative">
                    <Label htmlFor="phoneOwnerName">
                      ชื่อ-สกุล <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      name="phoneOwnerName"
                      defaultValue={serviceToEdit?.phoneOwnerName || ""}
                      placeholder="ระบุชื่อ-สกุลผู้ถือครอง"
                      className={fieldErrors?.phoneOwnerName ? "border-rose-500 ring-2 ring-rose-500/20" : ""}
                    />
                    <ErrorSpeechBubble message={fieldErrors?.phoneOwnerName} />
                  </div>

                  <div className="space-y-2 relative">
                    <Label htmlFor="phoneOwnerPosition">
                      ตำแหน่ง <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      name="phoneOwnerPosition"
                      defaultValue={serviceToEdit?.phoneOwnerPosition || ""}
                      placeholder="ระบุตำแหน่ง"
                      className={fieldErrors?.phoneOwnerPosition ? "border-rose-500 ring-2 ring-rose-500/20" : ""}
                    />
                    <ErrorSpeechBubble message={fieldErrors?.phoneOwnerPosition} />
                  </div>

                  <div className="space-y-2 relative">
                    <Label htmlFor="phoneReimbursementLimit">
                      เพดานสิทธิเบิก (บาท/เดือน){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      name="phoneReimbursementLimit"
                      value={phoneReimbursementLimit}
                      onValueChange={(v) => v && setPhoneReimbursementLimit(v)}
                      disabled={userRole === "user"}
                    >
                      <SelectTrigger className={fieldErrors?.phoneReimbursementLimit ? "border-rose-500 ring-2 ring-rose-500/20" : ""}>
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
                    <ErrorSpeechBubble message={fieldErrors?.phoneReimbursementLimit} />
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

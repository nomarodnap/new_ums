"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBill, getLatestEstimatedAmount } from "@/server/actions/bills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DatePickerBE } from "@/components/ui/date-picker-be";
import { MonthPickerBE } from "@/components/ui/month-picker-be";
import { Building2, Receipt, CalendarClock, UploadCloud, X, Settings, Banknote } from "lucide-react";
import { DepartmentServicesSheet } from "@/app/(dashboard)/departments/department-services-sheet";
import { DepartmentCombobox } from "@/components/ui/department-combobox";

type Department = {
  id: string;
  fullName: string;
  shortName: string | null;
  division: string | null;
  costCenterCode: string | null;
  type: string | null;
}

export function CreateBillForm({ departments, services = [], defaultDepartmentId }: { departments: Department[], services?: any[], defaultDepartmentId?: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createBill, null);
  const fieldErrors = typeof state?.error === "object" ? (state.error as Record<string, string[]>) : {};

  const [selectedDept, setSelectedDept] = useState(defaultDepartmentId || "");
  const [selectedUtility, setSelectedUtility] = useState("");
  const [selectedServiceNumbers, setSelectedServiceNumbers] = useState<string[]>([]);
  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  const [invoiceStatus, setInvoiceStatus] = useState("NOT_RECEIVED");
  const [disbursingType, setDisbursingType] = useState(() => {
    if (defaultDepartmentId) {
      const dept = departments.find(d => d.id === defaultDepartmentId);
      if (dept && !dept.costCenterCode) return "หน่วยงานฝากเบิก";
    }
    return "หน่วยงานที่เบิกจ่าย";
  });
  const [depositUnitId, setDepositUnitId] = useState("");
  const [servicesSheetOpen, setServicesSheetOpen] = useState(false);
  const [accountCode, setAccountCode] = useState("");
  const [billingMonthStr, setBillingMonthStr] = useState<string>("");
  const [estimatedAmount, setEstimatedAmount] = useState<number | "">("");

  useEffect(() => {
    async function fetchEstimated() {
      if (billingMonthStr && selectedServiceNumbers.length > 0) {
        // Join exactly as it will be saved in the database
        const serviceNumberString = selectedServiceNumbers.join(", ");
        const amount = await getLatestEstimatedAmount(serviceNumberString, billingMonthStr);
        if (amount !== null) {
          setEstimatedAmount(amount);
        } else {
          setEstimatedAmount("");
        }
      } else {
        setEstimatedAmount("");
      }
    }
    fetchEstimated();
  }, [billingMonthStr, selectedServiceNumbers]);

  const mainDepartments = defaultDepartmentId 
    ? departments.filter(d => d.id === defaultDepartmentId)
    : departments;

  const deptServices = services.filter(s => s.departmentId === selectedDept);
  const utilityServices = deptServices.filter(s => s.utilityType === selectedUtility);

  const firstService = utilityServices.find(s => s.serviceNumber === selectedServiceNumbers[0]);
  const provider = firstService?.provider || "";
  const selectedLocation = firstService?.locationType || "";

  const selectedDeptData = departments.find(d => d.id === selectedDept);

  const getDeptTypeName = (type: string | null | undefined) => {
    if (type === 'central') return 'ส่วนกลาง';
    if (type === 'regional_central') return 'ส่วนภูมิภาค (ส่วนกลาง)';
    if (type === 'regional') return 'ส่วนภูมิภาค';
    return type || '-';
  };

  const handleDeptChange = (val: string | null) => {
    if (!val) return;
    setSelectedDept(val);
    setSelectedUtility("");
    setSelectedServiceNumbers([]);
    
    const dept = departments.find(d => d.id === val);
    if (dept && !dept.costCenterCode) {
      setDisbursingType("หน่วยงานฝากเบิก");
    } else {
      setDisbursingType("หน่วยงานที่เบิกจ่าย");
      setDepositUnitId("");
    }
  };

  const handleDisbursingTypeChange = (val: string | null) => {
    if (!val) return;
    setDisbursingType(val);
    if (val !== "หน่วยงานฝากเบิก") {
      setDepositUnitId("");
    }
  };

  const handleUtilityChange = (val: string | null) => {
    if (!val) return;
    setSelectedUtility(val);
    setSelectedServiceNumbers([]);
    
    switch (val) {
      case "ค่าไฟฟ้า": setAccountCode("5104020101"); break;
      case "ค่าประปา&น้ำบาดาล": setAccountCode("5104020103"); break;
      case "ค่าโทรศัพท์": setAccountCode("5104020105"); break;
      case "ค่าสื่อสาร&โทรคมนาคม": setAccountCode("5104020106"); break;
      case "ค่าบริการไปรษณีย์": setAccountCode("5104020107"); break;
      default: setAccountCode(""); break;
    }
  };

  const addServiceNumber = (val: string | null) => {
    if (val && !selectedServiceNumbers.includes(val)) {
      setSelectedServiceNumbers([...selectedServiceNumbers, val].sort((a, b) => a.localeCompare(b, 'th')));
    }
  };

  const removeServiceNumber = (val: string) => {
    setSelectedServiceNumbers(selectedServiceNumbers.filter(sn => sn !== val));
  };

  useEffect(() => {
    if (state?.success) {
      router.push('/bills');
    }
  }, [state?.success, router]);

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>บันทึกค่าสาธารณูปโภคใหม่</CardTitle>
        <CardDescription>กรอกข้อมูลรายละเอียดค่าใช้จ่ายสาธารณูปโภคประจำเดือน</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          
          {state?.error && typeof state.error === 'string' && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              {state.error}
            </div>
          )}

          {state?.error && typeof state.error === 'object' && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              <p className="font-semibold mb-1">พบข้อผิดพลาด กรุณาตรวจสอบข้อมูล:</p>
              <ul className="list-disc pl-5 space-y-1">
                {Object.entries(state.error).map(([field, msgs]) => (
                  <li key={field}>{field}: {(msgs as string[]).join(', ')}</li>
                ))}
              </ul>
            </div>
          )}

          {state?.success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200 dark:bg-green-900/20 dark:text-green-400">
              บันทึกข้อมูลสำเร็จ
            </div>
          )}

          {/* Group 1: ข้อมูลทั่วไป */}
          <div className="space-y-4 rounded-xl border bg-card/50 p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-3">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg tracking-tight">ข้อมูลทั่วไป</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="grid gap-2">
                <Label htmlFor="departmentId">หน่วยงาน <span className="text-destructive">*</span></Label>
                <Select name="departmentId" value={selectedDept} onValueChange={handleDeptChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกหน่วยงาน...">
                      {(value: any) => {
                        if (!value) return null;
                        const dept = departments.find(d => d.id === value);
                        if (dept) return dept.fullName;
                        return value;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {mainDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id} label={dept.fullName}>
                        {dept.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors?.departmentId && <p className="text-xs text-destructive">{fieldErrors.departmentId[0]}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="division">อักษรย่อ</Label>
                <Input type="text" id="division" value={selectedDeptData?.shortName || "-"} onChange={() => {}} readOnly className="bg-muted cursor-not-allowed" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="costCenterCode">รหัสศูนย์ต้นทุน</Label>
                <Input type="text" id="costCenterCode" value={selectedDeptData?.costCenterCode || "-"} onChange={() => {}} readOnly className="bg-muted cursor-not-allowed" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deptType">ระดับหน่วยงาน</Label>
                <Input type="text" id="deptType" value={getDeptTypeName(selectedDeptData?.type)} onChange={() => {}} readOnly className="bg-muted cursor-not-allowed" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="disbursingType">ประเภทการเบิกจ่าย</Label>
                <Select name={selectedDeptData?.costCenterCode ? "disbursingType" : undefined} value={disbursingType} onValueChange={handleDisbursingTypeChange} disabled={!selectedDeptData?.costCenterCode}>
                  <SelectTrigger className={!selectedDeptData?.costCenterCode ? "bg-muted cursor-not-allowed" : ""}>
                    <SelectValue placeholder="เลือกประเภท..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="หน่วยงานที่เบิกจ่าย">หน่วยงานที่เบิกจ่าย</SelectItem>
                    <SelectItem value="หน่วยงานฝากเบิก">หน่วยงานฝากเบิก</SelectItem>
                  </SelectContent>
                </Select>
                {!selectedDeptData?.costCenterCode && (
                  <input type="hidden" name="disbursingType" value={disbursingType} />
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="depositUnit">ฝากเบิกกับหน่วยงาน {disbursingType === "หน่วยงานฝากเบิก" && <span className="text-destructive">*</span>}</Label>
                <div className="w-full">
                  <DepartmentCombobox 
                    departments={departments} 
                    name="depositUnit"
                    value={depositUnitId}
                    onValueChange={setDepositUnitId}
                    disabled={disbursingType !== "หน่วยงานฝากเบิก"}
                    placeholder={disbursingType === "หน่วยงานฝากเบิก" ? "ระบุหน่วยงานที่รับฝากเบิก" : "-"} 
                  />
                  {fieldErrors?.depositUnitId && <p className="text-xs text-destructive mt-1">{fieldErrors.depositUnitId[0]}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Group 2: ใบแจ้งหนี้ค่าสาธารณูปโภค */}
          <div className="space-y-4 rounded-xl border bg-card/50 p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-3">
              <Receipt className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg tracking-tight">ใบแจ้งหนี้ค่าสาธารณูปโภค</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="grid gap-2">
                <Label htmlFor="utilityType">ประเภทสาธารณูปโภค <span className="text-destructive">*</span></Label>
                <Select name="utilityType" value={selectedUtility} onValueChange={handleUtilityChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภทสาธารณูปโภค" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ค่าไฟฟ้า" label="ค่าไฟฟ้า">ค่าไฟฟ้า</SelectItem>
                    <SelectItem value="ค่าประปา&น้ำบาดาล" label="ค่าประปา&น้ำบาดาล">ค่าประปา&น้ำบาดาล</SelectItem>
                    <SelectItem value="ค่าโทรศัพท์" label="ค่าโทรศัพท์">ค่าโทรศัพท์</SelectItem>
                    <SelectItem value="ค่าสื่อสาร&โทรคมนาคม" label="ค่าสื่อสาร&โทรคมนาคม">ค่าสื่อสาร&โทรคมนาคม</SelectItem>
                    <SelectItem value="ค่าบริการไปรษณีย์" label="ค่าบริการไปรษณีย์">ค่าบริการไปรษณีย์</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors?.utilityType && <p className="text-xs text-destructive">{fieldErrors.utilityType[0]}</p>}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="serviceNumber">หมายเลขผู้ใช้ / รหัสเครื่องวัด <span className="text-destructive">*</span></Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-6 px-2 text-[11px] font-medium border-orange-500/30 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:border-orange-500/50 dark:bg-orange-950/30 dark:text-orange-400 dark:hover:bg-orange-950/50 shadow-sm transition-all" 
                    disabled={!selectedDeptData}
                    onClick={() => setServicesSheetOpen(true)}
                  >
                    จัดการหมายเลขผู้ใช้
                  </Button>
                </div>
                <Select value="" onValueChange={addServiceNumber} disabled={!selectedUtility || utilityServices.length === 0}>
                  <SelectTrigger className={!selectedUtility || utilityServices.length === 0 ? "bg-muted cursor-not-allowed" : ""}>
                    <SelectValue placeholder={!selectedUtility ? "กรุณาเลือกประเภทสาธารณูปโภคก่อน" : utilityServices.length === 0 ? "ไม่พบหมายเลขในระบบ" : "เพิ่มหมายเลขผู้ใช้..."}>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {utilityServices.filter(svc => !selectedServiceNumbers.includes(svc.serviceNumber)).map((svc) => (
                      <SelectItem key={svc.id} value={svc.serviceNumber} label={svc.serviceNumber}>
                        {svc.serviceNumber} {svc.provider ? `(${svc.provider})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <input type="hidden" name="serviceNumber" value={selectedServiceNumbers.join(", ")} />
                
                {selectedServiceNumbers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedServiceNumbers.map(sn => (
                      <Badge key={sn} variant="secondary" className="flex items-center gap-1 px-3 py-1 text-sm">
                        {sn}
                        <button type="button" onClick={() => removeServiceNumber(sn)} className="text-muted-foreground hover:text-destructive ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                
                {fieldErrors?.serviceNumber && <p className="text-xs text-destructive whitespace-pre-line">{fieldErrors.serviceNumber[0]}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  สามารถเลือกได้หลายหมายเลข (ในกรณีที่ชำระบิลรวมกัน)
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="provider">ผู้ให้บริการ</Label>
                <Input type="text" id="provider" name="provider" value={provider} onChange={() => {}} readOnly className="bg-muted cursor-not-allowed" placeholder="เลือกหมายเลขผู้ใช้ก่อน" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="locationType">ที่ตั้ง</Label>
                <Input type="text" id="locationType" name="locationType" value={selectedLocation} onChange={() => {}} readOnly className="bg-muted cursor-not-allowed" placeholder="เลือกหมายเลขผู้ใช้ก่อน" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="billingMonth">รอบบิลประจำเดือน <span className="text-destructive">*</span></Label>
                <MonthPickerBE 
                  id="billingMonth" 
                  name="billingMonth" 
                  required 
                  onChange={(val) => setBillingMonthStr(val)}
                />
                {fieldErrors?.billingMonth && <p className="text-xs text-destructive">{fieldErrors.billingMonth[0]}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="estimatedAmount">ค่าใช้จ่ายโดยประมาณการ</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  id="estimatedAmount" 
                  name="estimatedAmount" 
                  value={estimatedAmount}
                  readOnly 
                  className="bg-muted"
                  placeholder="ระบบคำนวณอัตโนมัติ"
                />
              </div>
            </div>
          </div>

          {/* Group 3: การรับใบแจ้งหนี้ */}
          <div className="space-y-4 rounded-xl border bg-card/50 p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-3">
              <CalendarClock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg tracking-tight">การรับใบแจ้งหนี้</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-5">
              <div className="grid gap-2">
                <Label>สถานะใบแจ้งหนี้ <span className="text-destructive">*</span></Label>
                <input type="hidden" name="invoiceStatus" value={invoiceStatus} />
                <RadioGroup 
                  value={invoiceStatus} 
                  onValueChange={setInvoiceStatus}
                  name="invoiceStatus"
                  className="flex flex-col space-y-2 mt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="NOT_RECEIVED" id="not_received" />
                    <Label htmlFor="not_received" className="font-normal cursor-pointer">ยังไม่ได้รับใบแจ้งหนี้</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="RECEIVED" id="received" />
                    <Label htmlFor="received" className="font-normal cursor-pointer">ได้รับใบแจ้งหนี้แล้ว</Label>
                  </div>
                </RadioGroup>
              </div>

              {invoiceStatus === "RECEIVED" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-dashed mt-2">
                  <div className="grid gap-2">
                    <Label htmlFor="invoiceDate">วันที่ใบแจ้งหนี้ <span className="text-destructive">*</span></Label>
                    <DatePickerBE id="invoiceDate" name="invoiceDate" required={true} />
                    {fieldErrors?.invoiceDate && <p className="text-xs text-destructive">{fieldErrors.invoiceDate[0]}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="receivedDate">วันที่ลงรับใบแจ้งหนี้ <span className="text-destructive">*</span></Label>
                    <DatePickerBE id="receivedDate" name="receivedDate" required={true} />
                    {fieldErrors?.receivedDate && <p className="text-xs text-destructive">{fieldErrors.receivedDate[0]}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="sentToDisbursingDate">
                      หน่วยฝากเบิกส่งเอกสาร
                    </Label>
                    <DatePickerBE 
                      id="sentToDisbursingDate" 
                      name="sentToDisbursingDate" 
                      required={false} 
                      disabled={disbursingType !== "หน่วยงานฝากเบิก"} 
                    />
                    {fieldErrors?.sentToDisbursingDate && <p className="text-xs text-destructive">{fieldErrors.sentToDisbursingDate[0]}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="disbursingReceivedDate">
                      วันที่หน่วยเบิกจ่ายลงรับใบแจ้งหนี้
                    </Label>
                    <DatePickerBE 
                      id="disbursingReceivedDate" 
                      name="disbursingReceivedDate" 
                      required={false} 
                      disabled={disbursingType !== "หน่วยงานฝากเบิก"} 
                    />
                    {fieldErrors?.disbursingReceivedDate && <p className="text-xs text-destructive">{fieldErrors.disbursingReceivedDate[0]}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="amountBaht">จำนวนเงิน (บาท) <span className="text-destructive">*</span></Label>
                    <Input type="number" step="0.01" id="amountBaht" name="amountBaht" defaultValue="" placeholder="0.00" required className="font-medium text-lg" />
                    {fieldErrors?.amountBaht && <p className="text-xs text-destructive">{fieldErrors.amountBaht[0]}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="unitsUsed">
                      ปริมาณการใช้ (kWh / m³) {(selectedUtility === "ค่าไฟฟ้า" || selectedUtility === "ค่าประปา&น้ำบาดาล") && <span className="text-destructive">*</span>}
                    </Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      id="unitsUsed" 
                      name="unitsUsed" 
                      defaultValue="" 
                      placeholder="0.00" 
                      required={selectedUtility === "ค่าไฟฟ้า" || selectedUtility === "ค่าประปา&น้ำบาดาล"} 
                      disabled={!(selectedUtility === "ค่าไฟฟ้า" || selectedUtility === "ค่าประปา&น้ำบาดาล")}
                      className={!(selectedUtility === "ค่าไฟฟ้า" || selectedUtility === "ค่าประปา&น้ำบาดาล") ? "bg-muted cursor-not-allowed" : ""}
                    />
                    {fieldErrors?.unitsUsed && <p className="text-xs text-destructive">{fieldErrors.unitsUsed[0]}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="documentRef">เลขที่ใบแจ้งหนี้ สถานะการเบิกจ่าย<span className="text-destructive">*</span></Label>
                    <Input type="text" id="documentRef" name="documentRef" defaultValue="" placeholder="เช่น 6811000709" required />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="attachmentInvoice">เอกสารใบแจ้งหนี้ <span className="text-destructive">*</span></Label>
                    <Input type="file" id="attachmentInvoice" name="attachmentInvoice" accept=".pdf,image/*" className="cursor-pointer" required />
                    {fieldErrors?.attachmentInvoice && <p className="text-xs text-destructive">{fieldErrors.attachmentInvoice[0]}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Group 4: การเบิกจ่ายค่าสาธารณูปโภค */}
          <div className="space-y-4 rounded-xl border bg-card/50 p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-3">
              <Banknote className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg tracking-tight">การเบิกจ่ายค่าสาธารณูปโภค</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-5">
              <div className="grid gap-2">
                <Label>สถานะการเบิกจ่าย <span className="text-destructive">*</span></Label>
                <input type="hidden" name="paymentStatus" value={paymentStatus} />
                <RadioGroup 
                  value={paymentStatus} 
                  onValueChange={setPaymentStatus}
                  name="paymentStatus"
                  className="flex flex-col space-y-2 mt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PENDING" id="payment_pending" />
                    <Label htmlFor="payment_pending" className="font-normal cursor-pointer">ยังไม่ได้เบิกจ่าย</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PAID" id="payment_paid" disabled={invoiceStatus === "NOT_RECEIVED"} />
                    <Label htmlFor="payment_paid" className={`font-normal cursor-pointer ${invoiceStatus === "NOT_RECEIVED" ? "text-muted-foreground opacity-50" : ""}`}>เบิกจ่ายแล้ว</Label>
                  </div>
                </RadioGroup>
              </div>

              {paymentStatus === "PAID" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-dashed mt-2">
                  <div className="grid gap-2">
                    <Label htmlFor="paymentDate">วันที่เอกสาร <span className="text-destructive">*</span></Label>
                    <DatePickerBE id="paymentDate" name="paymentDate" required={true} />
                    {fieldErrors?.paymentDate && <p className="text-xs text-destructive">{fieldErrors.paymentDate[0]}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label>รหัสศูนย์ต้นทุน</Label>
                    <Input type="text" value={disbursingType === "หน่วยงานฝากเบิก" && depositUnitId ? (departments.find(d => d.id === depositUnitId)?.costCenterCode || "-") : (selectedDeptData?.costCenterCode || "-")} readOnly className="bg-muted cursor-not-allowed" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="budgetCode">รหัสงบประมาณ <span className="text-destructive">*</span></Label>
                    <Input type="text" id="budgetCode" name="budgetCode" defaultValue="" placeholder="เช่น 07005302001002000000" required={true} />
                    {fieldErrors?.budgetCode && <p className="text-xs text-destructive">{fieldErrors.budgetCode[0]}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="paymentDocNumber">เลขเอกสาร <span className="text-destructive">*</span></Label>
                    <Input type="text" id="paymentDocNumber" name="paymentDocNumber" defaultValue="" placeholder="เช่น 3100011102" required={true} />
                    {fieldErrors?.paymentDocNumber && <p className="text-xs text-destructive">{fieldErrors.paymentDocNumber[0]}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="docType">ประเภทเอกสาร <span className="text-destructive">*</span></Label>
                    <Input type="text" id="docType" name="docType" value="KC" readOnly className="bg-muted cursor-not-allowed" required={true} />
                    {fieldErrors?.docType && <p className="text-xs text-destructive">{fieldErrors.docType[0]}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="accountCode">รหัสแยกประเภท<span className="text-destructive">*</span></Label>
                    <Input 
                      type="text" 
                      id="accountCode" 
                      name="accountCode" 
                      placeholder="ขึ้นให้อัตโนมัตสอดคล้องกับประเภทสาธารณูปโภคที่เลือก" 
                      required={true} 
                      value={accountCode}
                      onChange={() => {}}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                    {fieldErrors?.accountCode && <p className="text-xs text-destructive">{fieldErrors.accountCode[0]}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="paidAmount">จำนวนเงิน (บาท) <span className="text-destructive">*</span></Label>
                    <Input type="number" step="0.01" id="paidAmount" name="paidAmount" defaultValue="" placeholder="0.00" required={true} />
                    {fieldErrors?.paidAmount && <p className="text-xs text-destructive">{fieldErrors.paidAmount[0]}</p>}
                  </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-dashed">
                    <div className="flex items-center gap-2 mb-4">
                      <UploadCloud className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-md tracking-tight">ไฟล์แนบหลักฐาน</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="grid gap-2 bg-background p-3 rounded-lg border border-dashed">
                        <Label htmlFor="attachmentReceipt" className="font-medium">ใบเสร็จรับเงิน <span className="text-destructive">*</span></Label>
                        <Input type="file" id="attachmentReceipt" name="attachmentReceipt" accept="image/*,.pdf" className="cursor-pointer file:cursor-pointer text-xs" required={true} />
                      </div>
                      
                      <div className="grid gap-2 bg-background p-3 rounded-lg border border-dashed">
                        <Label htmlFor="attachmentDirectPayment" className="font-medium">รายงานจ่ายตรง / รายงาน KTB <span className="text-destructive">*</span></Label>
                        <Input type="file" id="attachmentDirectPayment" name="attachmentDirectPayment" accept="image/*,.pdf" className="cursor-pointer file:cursor-pointer text-xs" required={true} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>



        </CardContent>
        <CardFooter className="flex justify-end gap-2 bg-muted/50 p-4 rounded-b-xl border-t mt-4">
          <Button variant="outline" type="button" onClick={() => window.history.back()}>ยกเลิก</Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </Button>
        </CardFooter>
      </form>

      {selectedDeptData && (
        <DepartmentServicesSheet 
          department={selectedDeptData}
          services={deptServices}
          open={servicesSheetOpen}
          onOpenChange={setServicesSheetOpen}
        />
      )}
    </Card>
  );
}

"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBill, getLatestEstimatedAmount } from "@/server/actions/bills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DatePickerBE } from "@/components/ui/date-picker-be";
import { MonthPickerBE } from "@/components/ui/month-picker-be";
import {
  Building2,
  Receipt,
  CalendarClock,
  UploadCloud,
  X,
  Settings,
  Banknote,
} from "lucide-react";
import { DepartmentServicesSheet } from "@/app/(dashboard)/departments/department-services-sheet";
import { DepartmentCombobox } from "@/components/ui/department-combobox";

type Department = {
  id: string;
  fullName: string;
  shortName: string | null;
  division: string | null;
  costCenterCode: string | null;
  depositUnit?: string | null;
  type: string | null;
};

type BudgetCodeOption = {
  id: string;
  code: string;
  name: string;
  fiscalYear: number;
  description?: string | null;
  isActive?: boolean;
};

export function CreateBillForm({
  departments,
  services = [],
  budgetCodes = [],
  defaultDepartmentId,
}: {
  departments: Department[];
  services?: any[];
  budgetCodes?: BudgetCodeOption[];
  defaultDepartmentId?: string;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createBill, null);
  const fieldErrors =
    typeof state?.error === "object"
      ? (state.error as Record<string, string[]>)
      : {};

  const [selectedDept, setSelectedDept] = useState(defaultDepartmentId || "");
  const [selectedUtility, setSelectedUtility] = useState("");
  const [selectedServiceNumbers, setSelectedServiceNumbers] = useState<
    string[]
  >([]);
  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  const [invoiceStatus, setInvoiceStatus] = useState("NOT_RECEIVED");
  const [disbursingType, setDisbursingType] = useState(() => {
    if (defaultDepartmentId) {
      const dept = departments.find((d) => d.id === defaultDepartmentId);
      if (dept && !dept.costCenterCode) return "หน่วยงานฝากเบิก";
    }
    return "หน่วยงานที่เบิกจ่าย";
  });
  const [depositUnitId, setDepositUnitId] = useState(() => {
    if (defaultDepartmentId) {
      const dept = departments.find((d) => d.id === defaultDepartmentId);
      if (dept && !dept.costCenterCode) return dept.depositUnit || "";
    }
    return "";
  });
  const [costCenterCode, setCostCenterCode] = useState("");
  const [servicesSheetOpen, setServicesSheetOpen] = useState(false);
  const [accountCode, setAccountCode] = useState("");
  const [budgetCode, setBudgetCode] = useState("");
  const [billingMonthStr, setBillingMonthStr] = useState<string>("");
  const [estimatedAmount, setEstimatedAmount] = useState<number | "">("");
  const [serviceAmounts, setServiceAmounts] = useState<Record<string, string>>(
    {},
  );

  const currentFiscalYear = useMemo(() => {
    if (billingMonthStr) {
      const [yr, mo] = billingMonthStr.split("-").map(Number);
      if (yr && mo) {
        const be = yr + 543;
        return mo >= 10 ? be + 1 : be;
      }
    }
    const now = new Date();
    const be = now.getFullYear() + 543;
    return now.getMonth() >= 9 ? be + 1 : be;
  }, [billingMonthStr]);

  const sortedBudgetCodes = useMemo(() => {
    if (!budgetCodes || budgetCodes.length === 0) return [];
    return [...budgetCodes].sort((a, b) => {
      const aIsCurrent = a.fiscalYear === currentFiscalYear ? 1 : 0;
      const bIsCurrent = b.fiscalYear === currentFiscalYear ? 1 : 0;
      if (aIsCurrent !== bIsCurrent) return bIsCurrent - aIsCurrent;
      return b.fiscalYear - a.fiscalYear;
    });
  }, [budgetCodes, currentFiscalYear]);

  const handleServiceAmountChange = (sn: string, val: string) => {
    setServiceAmounts((prev) => ({
      ...prev,
      [sn]: val,
    }));
  };

  const hasEnteredAnyAmount = selectedServiceNumbers.some(
    (sn) => serviceAmounts[sn] !== undefined && serviceAmounts[sn] !== "",
  );

  const totalCalculatedAmount = selectedServiceNumbers.reduce((sum, sn) => {
    const val = parseFloat(serviceAmounts[sn] || "0");
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const displayTotalAmount = hasEnteredAnyAmount
    ? totalCalculatedAmount.toFixed(2)
    : "";

  useEffect(() => {
    const code =
      disbursingType === "หน่วยงานฝากเบิก" && depositUnitId
        ? departments.find((d) => d.id === depositUnitId)?.costCenterCode || ""
        : departments.find((d) => d.id === selectedDept)?.costCenterCode || "";
    setCostCenterCode(code);
  }, [selectedDept, disbursingType, depositUnitId, departments]);

  useEffect(() => {
    async function fetchEstimated() {
      if (billingMonthStr && selectedServiceNumbers.length > 0) {
        // Join exactly as it will be saved in the database
        const serviceNumberString = selectedServiceNumbers.join(", ");
        const amount = await getLatestEstimatedAmount(
          serviceNumberString,
          billingMonthStr,
        );
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

  const [paidAmountVal, setPaidAmountVal] = useState("");

  const mainDepartments = defaultDepartmentId
    ? departments.filter((d) => d.id === defaultDepartmentId)
    : departments;

  const deptServices = services.filter((s) => s.departmentId === selectedDept);
  const utilityServices = deptServices.filter(
    (s) => s.utilityType === selectedUtility,
  );

  const maxReimbursableAmount = useMemo(() => {
    if (selectedUtility !== "ค่าโทรศัพท์") return null;
    let total = 0;
    let hasLimit = false;
    for (const sn of selectedServiceNumbers) {
      const svc = utilityServices.find((s) => s.serviceNumber === sn);
      const billed = parseFloat(serviceAmounts[sn] || "0") || 0;
      if (svc?.phoneReimbursementLimit && svc.phoneReimbursementLimit > 0) {
        hasLimit = true;
        total += Math.min(billed, svc.phoneReimbursementLimit);
      } else {
        total += billed;
      }
    }
    return hasLimit ? total : null;
  }, [
    selectedUtility,
    selectedServiceNumbers,
    utilityServices,
    serviceAmounts,
  ]);

  const isPaidOverLimit =
    selectedUtility === "ค่าโทรศัพท์" &&
    maxReimbursableAmount !== null &&
    parseFloat(paidAmountVal || "0") > maxReimbursableAmount + 0.001;

  const firstService = utilityServices.find(
    (s) => s.serviceNumber === selectedServiceNumbers[0],
  );
  const provider = firstService?.provider || "";
  const selectedLocation = firstService?.locationType || "";

  const selectedDeptData = departments.find((d) => d.id === selectedDept);

  const getDeptTypeName = (type: string | null | undefined) => {
    if (type === "central") return "ส่วนกลาง";
    if (type === "regional_central") return "ส่วนภูมิภาค (ส่วนกลาง)";
    if (type === "regional") return "ส่วนภูมิภาค";
    return type || "-";
  };

  const handleDeptChange = (val: string | null) => {
    if (!val) return;
    setSelectedDept(val);
    setSelectedUtility("");
    setSelectedServiceNumbers([]);
    setServiceAmounts({});

    const dept = departments.find((d) => d.id === val);
    if (dept && !dept.costCenterCode) {
      setDisbursingType("หน่วยงานฝากเบิก");
      setDepositUnitId(dept.depositUnit || "");
    } else {
      setDisbursingType("หน่วยงานที่เบิกจ่าย");
      setDepositUnitId("");
    }
  };

  const handleDisbursingTypeChange = (val: string | null) => {
    if (!val) return;
    setDisbursingType(val);
    if (val === "หน่วยงานฝากเบิก") {
      const dept = departments.find((d) => d.id === selectedDept);
      setDepositUnitId(dept?.depositUnit || "");
    } else {
      setDepositUnitId("");
    }
  };

  const handleUtilityChange = (val: string | null) => {
    if (!val) return;
    setSelectedUtility(val);
    setSelectedServiceNumbers([]);
    setServiceAmounts({});

    switch (val) {
      case "ค่าไฟฟ้า":
        setAccountCode("5104020101");
        break;
      case "ค่าประปา&น้ำบาดาล":
        setAccountCode("5104020103");
        break;
      case "ค่าโทรศัพท์":
        setAccountCode("5104020105");
        break;
      case "ค่าสื่อสาร&โทรคมนาคม":
        setAccountCode("5104020106");
        break;
      case "ค่าบริการไปรษณีย์":
        setAccountCode("5104020107");
        break;
      default:
        setAccountCode("");
        break;
    }
  };

  const addServiceNumber = (val: string | null) => {
    if (val && !selectedServiceNumbers.includes(val)) {
      setSelectedServiceNumbers(
        [...selectedServiceNumbers, val].sort((a, b) =>
          a.localeCompare(b, "th"),
        ),
      );
    }
  };

  const removeServiceNumber = (val: string) => {
    setSelectedServiceNumbers(
      selectedServiceNumbers.filter((sn) => sn !== val),
    );
    setServiceAmounts((prev) => {
      const next = { ...prev };
      delete next[val];
      return next;
    });
  };

  useEffect(() => {
    if (state?.success) {
      router.push("/bills");
    }
  }, [state?.success, router]);

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>บันทึกค่าสาธารณูปโภคใหม่</CardTitle>
        <CardDescription>
          กรอกข้อมูลรายละเอียดค่าใช้จ่ายสาธารณูปโภคประจำเดือน
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          {state?.error && typeof state.error === "string" && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              {state.error}
            </div>
          )}

          {state?.error && typeof state.error === "object" && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              <p className="font-semibold mb-1">พบข้อผิดพลาด กรุณาตรวจสอบข้อมูล:</p>
              <ul className="list-disc pl-5 space-y-1">
                {Object.entries(state.error).map(([field, msgs]) => (
                  <li key={field}>
                    {field}: {(msgs as string[]).join(", ")}
                  </li>
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
                <Label htmlFor="departmentId">
                  หน่วยงาน <span className="text-destructive">*</span>
                </Label>
                <Select
                  name="departmentId"
                  value={selectedDept}
                  onValueChange={handleDeptChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกหน่วยงาน...">
                      {(value: any) => {
                        if (!value) return null;
                        const dept = departments.find((d) => d.id === value);
                        if (dept) return dept.fullName;
                        return value;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {mainDepartments.map((dept) => (
                      <SelectItem
                        key={dept.id}
                        value={dept.id}
                        label={dept.fullName}
                      >
                        {dept.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors?.departmentId && (
                  <p className="text-xs text-destructive">
                    {fieldErrors.departmentId[0]}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="division">อักษรย่อ</Label>
                <Input
                  type="text"
                  id="division"
                  value={selectedDeptData?.shortName || "-"}
                  onChange={() => {}}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="costCenterCode">รหัสศูนย์ต้นทุน</Label>
                <Input
                  type="text"
                  id="costCenterCode"
                  value={selectedDeptData?.costCenterCode || "-"}
                  onChange={() => {}}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deptType">ระดับหน่วยงาน</Label>
                <Input
                  type="text"
                  id="deptType"
                  value={getDeptTypeName(selectedDeptData?.type)}
                  onChange={() => {}}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="disbursingType">ประเภทการเบิกจ่าย</Label>
                <Select
                  name={
                    selectedDeptData?.costCenterCode
                      ? "disbursingType"
                      : undefined
                  }
                  value={disbursingType}
                  onValueChange={handleDisbursingTypeChange}
                  disabled={!selectedDeptData?.costCenterCode}
                >
                  <SelectTrigger
                    className={
                      !selectedDeptData?.costCenterCode
                        ? "bg-muted cursor-not-allowed"
                        : ""
                    }
                  >
                    <SelectValue placeholder="เลือกประเภท..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="หน่วยงานที่เบิกจ่าย">
                      หน่วยงานที่เบิกจ่าย
                    </SelectItem>
                    <SelectItem value="หน่วยงานฝากเบิก">หน่วยงานฝากเบิก</SelectItem>
                  </SelectContent>
                </Select>
                {!selectedDeptData?.costCenterCode && (
                  <input
                    type="hidden"
                    name="disbursingType"
                    value={disbursingType}
                  />
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="depositUnit">
                  ฝากเบิกกับหน่วยงาน{" "}
                  {disbursingType === "หน่วยงานฝากเบิก" && (
                    <span className="text-destructive">*</span>
                  )}
                </Label>
                <div className="w-full">
                  <DepartmentCombobox
                    departments={departments}
                    name="depositUnit"
                    value={depositUnitId}
                    onValueChange={setDepositUnitId}
                    disabled={disbursingType !== "หน่วยงานฝากเบิก"}
                    placeholder={
                      disbursingType === "หน่วยงานฝากเบิก"
                        ? "ระบุหน่วยงานที่รับฝากเบิก"
                        : "-"
                    }
                  />
                  {fieldErrors?.depositUnitId && (
                    <p className="text-xs text-destructive mt-1">
                      {fieldErrors.depositUnitId[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Group 2: ใบแจ้งหนี้ค่าสาธารณูปโภค */}
          <div className="space-y-4 rounded-xl border bg-card/50 p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-3">
              <Receipt className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg tracking-tight">
                ใบแจ้งหนี้ค่าสาธารณูปโภค
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="grid gap-2">
                <Label htmlFor="utilityType">
                  ประเภทสาธารณูปโภค <span className="text-destructive">*</span>
                </Label>
                <Select
                  name="utilityType"
                  value={selectedUtility}
                  onValueChange={handleUtilityChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภทสาธารณูปโภค" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ค่าไฟฟ้า" label="ค่าไฟฟ้า">
                      ค่าไฟฟ้า
                    </SelectItem>
                    <SelectItem value="ค่าประปา&น้ำบาดาล" label="ค่าประปา&น้ำบาดาล">
                      ค่าประปา&น้ำบาดาล
                    </SelectItem>
                    <SelectItem value="ค่าโทรศัพท์" label="ค่าโทรศัพท์">
                      ค่าโทรศัพท์
                    </SelectItem>
                    <SelectItem
                      value="ค่าสื่อสาร&โทรคมนาคม"
                      label="ค่าสื่อสาร&โทรคมนาคม"
                    >
                      ค่าสื่อสาร&โทรคมนาคม
                    </SelectItem>
                    <SelectItem value="ค่าบริการไปรษณีย์" label="ค่าบริการไปรษณีย์">
                      ค่าบริการไปรษณีย์
                    </SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors?.utilityType && (
                  <p className="text-xs text-destructive">
                    {fieldErrors.utilityType[0]}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="serviceNumber">
                    หมายเลขผู้ใช้ / รหัสเครื่องวัด{" "}
                    <span className="text-destructive">*</span>
                  </Label>
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
                <Select
                  value=""
                  onValueChange={addServiceNumber}
                  disabled={!selectedUtility || utilityServices.length === 0}
                >
                  <SelectTrigger
                    className={
                      !selectedUtility || utilityServices.length === 0
                        ? "bg-muted cursor-not-allowed"
                        : ""
                    }
                  >
                    <SelectValue
                      placeholder={
                        !selectedUtility
                          ? "กรุณาเลือกประเภทสาธารณูปโภคก่อน"
                          : utilityServices.length === 0
                            ? "ไม่พบหมายเลขในระบบ"
                            : "เพิ่มหมายเลขผู้ใช้..."
                      }
                    ></SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {utilityServices
                      .filter(
                        (svc) =>
                          !selectedServiceNumbers.includes(svc.serviceNumber),
                      )
                      .map((svc) => (
                        <SelectItem
                          key={svc.id}
                          value={svc.serviceNumber}
                          label={svc.serviceNumber}
                        >
                          {svc.serviceNumber}{" "}
                          {svc.provider ? `(${svc.provider})` : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <input
                  type="hidden"
                  name="serviceNumber"
                  value={selectedServiceNumbers.join(", ")}
                />
                <input
                  type="hidden"
                  name="serviceBreakdown"
                  value={JSON.stringify(serviceAmounts)}
                />

                {selectedServiceNumbers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedServiceNumbers.map((sn) => (
                      <Badge
                        key={sn}
                        variant="secondary"
                        className="flex items-center gap-1 px-3 py-1 text-sm"
                      >
                        {sn}
                        <button
                          type="button"
                          onClick={() => removeServiceNumber(sn)}
                          className="text-muted-foreground hover:text-destructive ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {fieldErrors?.serviceNumber && (
                  <p className="text-xs text-destructive whitespace-pre-line">
                    {fieldErrors.serviceNumber[0]}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  สามารถเลือกได้หลายหมายเลข (ในกรณีที่ชำระบิลรวมกัน)
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="provider">ผู้ให้บริการ</Label>
                <Input
                  type="text"
                  id="provider"
                  name="provider"
                  value={provider}
                  onChange={() => {}}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                  placeholder="เลือกหมายเลขผู้ใช้ก่อน"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="locationType">ที่ตั้ง</Label>
                <Input
                  type="text"
                  id="locationType"
                  name="locationType"
                  value={selectedLocation}
                  onChange={() => {}}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                  placeholder="เลือกหมายเลขผู้ใช้ก่อน"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="billingMonth">
                  รอบบิลประจำเดือน <span className="text-destructive">*</span>
                </Label>
                <MonthPickerBE
                  id="billingMonth"
                  name="billingMonth"
                  required
                  onChange={(val) => setBillingMonthStr(val)}
                />
                {fieldErrors?.billingMonth && (
                  <p className="text-xs text-destructive">
                    {fieldErrors.billingMonth[0]}
                  </p>
                )}
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
              <h3 className="font-semibold text-lg tracking-tight">
                การรับใบแจ้งหนี้
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div className="grid gap-2">
                <Label>
                  สถานะใบแจ้งหนี้ <span className="text-destructive">*</span>
                </Label>
                <input
                  type="hidden"
                  name="invoiceStatus"
                  value={invoiceStatus}
                />
                <RadioGroup
                  value={invoiceStatus}
                  onValueChange={setInvoiceStatus}
                  name="invoiceStatus"
                  className="flex flex-col space-y-2 mt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="NOT_RECEIVED" id="not_received" />
                    <Label
                      htmlFor="not_received"
                      className="font-normal cursor-pointer"
                    >
                      ยังไม่ได้รับใบแจ้งหนี้
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="RECEIVED" id="received" />
                    <Label
                      htmlFor="received"
                      className="font-normal cursor-pointer"
                    >
                      ได้รับใบแจ้งหนี้แล้ว
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {invoiceStatus === "RECEIVED" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-dashed mt-2">
                  <div className="grid gap-2">
                    <Label htmlFor="invoiceDate">
                      วันที่ใบแจ้งหนี้ <span className="text-destructive">*</span>
                    </Label>
                    <DatePickerBE
                      id="invoiceDate"
                      name="invoiceDate"
                      required={true}
                    />
                    {fieldErrors?.invoiceDate && (
                      <p className="text-xs text-destructive">
                        {fieldErrors.invoiceDate[0]}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="receivedDate">
                      วันที่ลงรับใบแจ้งหนี้ <span className="text-destructive">*</span>
                    </Label>
                    <DatePickerBE
                      id="receivedDate"
                      name="receivedDate"
                      required={true}
                    />
                    {fieldErrors?.receivedDate && (
                      <p className="text-xs text-destructive">
                        {fieldErrors.receivedDate[0]}
                      </p>
                    )}
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
                    {fieldErrors?.sentToDisbursingDate && (
                      <p className="text-xs text-destructive">
                        {fieldErrors.sentToDisbursingDate[0]}
                      </p>
                    )}
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
                    {fieldErrors?.disbursingReceivedDate && (
                      <p className="text-xs text-destructive">
                        {fieldErrors.disbursingReceivedDate[0]}
                      </p>
                    )}
                  </div>

                  {/* Breakdown by Service Number */}
                  <div className="md:col-span-2 space-y-3 rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <Label className="font-semibold text-sm flex items-center gap-2">
                        <span>ระบุจำนวนเงินตามหมายเลขผู้ใช้ / รหัสเครื่องวัด</span>
                        <Badge
                          variant="secondary"
                          className="text-xs font-normal"
                        >
                          {selectedServiceNumbers.length} หมายเลข
                        </Badge>
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        ระบบจะรวมยอดเงินให้อัตโนมัติ
                      </span>
                    </div>

                    {selectedServiceNumbers.length === 0 ? (
                      <p className="text-xs text-amber-600 dark:text-amber-400 py-1">
                        * กรุณาเลือกหมายเลขผู้ใช้ / รหัสเครื่องวัดในส่วนใบแจ้งหนี้ด้านบนก่อน
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {selectedServiceNumbers.map((sn, idx) => {
                          const svcInfo = utilityServices.find(
                            (s) => s.serviceNumber === sn,
                          );
                          const isOverLimit =
                            selectedUtility === "ค่าโทรศัพท์" &&
                            svcInfo?.phoneReimbursementLimit &&
                            parseFloat(serviceAmounts[sn] || "0") >
                              svcInfo.phoneReimbursementLimit;

                          return (
                            <div key={sn} className="grid gap-1.5">
                              <div className="flex items-center justify-between">
                                <Label
                                  htmlFor={`service_amount_${idx}`}
                                  className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 flex-wrap"
                                >
                                  <span>
                                    หมายเลข:{" "}
                                    <span className="font-semibold text-foreground">
                                      {sn}
                                    </span>
                                    {svcInfo?.phoneOwnerName && (
                                      <span className="text-muted-foreground ml-1 font-normal">
                                        ({svcInfo.phoneOwnerName})
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-destructive">*</span>
                                </Label>
                                {svcInfo?.phoneReimbursementLimit && (
                                  <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-normal">
                                    สิทธิ: ฿
                                    {svcInfo.phoneReimbursementLimit.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <Input
                                type="number"
                                step="0.01"
                                id={`service_amount_${idx}`}
                                value={serviceAmounts[sn] || ""}
                                onChange={(e) =>
                                  handleServiceAmountChange(sn, e.target.value)
                                }
                                placeholder="0.00"
                                required
                                className={
                                  isOverLimit
                                    ? "border-amber-500 focus-visible:ring-amber-500"
                                    : ""
                                }
                              />
                              {isOverLimit && (
                                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                  ⚠️ เกินสิทธิเบิกจ่ายประจำเดือน (฿
                                  {svcInfo.phoneReimbursementLimit?.toLocaleString()}
                                  )
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="amountBaht">
                      รวมเป็นจำนวนเงิน (บาท){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      id="amountBaht"
                      name="amountBaht"
                      value={displayTotalAmount}
                      readOnly
                      className="bg-muted cursor-not-allowed font-medium"
                      placeholder="0.00"
                      required
                    />
                    {fieldErrors?.amountBaht && (
                      <p className="text-xs text-destructive">
                        {fieldErrors.amountBaht[0]}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="unitsUsed">
                      ปริมาณการใช้ (kWh / m³){" "}
                      {(selectedUtility === "ค่าไฟฟ้า" ||
                        selectedUtility === "ค่าประปา&น้ำบาดาล") && (
                        <span className="text-destructive">*</span>
                      )}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      id="unitsUsed"
                      name="unitsUsed"
                      defaultValue=""
                      placeholder="0.00"
                      required={
                        selectedUtility === "ค่าไฟฟ้า" ||
                        selectedUtility === "ค่าประปา&น้ำบาดาล"
                      }
                      disabled={
                        !(
                          selectedUtility === "ค่าไฟฟ้า" ||
                          selectedUtility === "ค่าประปา&น้ำบาดาล"
                        )
                      }
                      className={
                        !(
                          selectedUtility === "ค่าไฟฟ้า" ||
                          selectedUtility === "ค่าประปา&น้ำบาดาล"
                        )
                          ? "bg-muted cursor-not-allowed"
                          : ""
                      }
                    />
                    {fieldErrors?.unitsUsed && (
                      <p className="text-xs text-destructive">
                        {fieldErrors.unitsUsed[0]}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="documentRef">
                      เลขที่ใบแจ้งหนี้ สถานะการเบิกจ่าย
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="documentRef"
                      name="documentRef"
                      defaultValue=""
                      placeholder="เช่น 6811000709"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="attachmentInvoice">
                      เอกสารใบแจ้งหนี้ <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="file"
                      id="attachmentInvoice"
                      name="attachmentInvoice"
                      accept=".pdf,image/*"
                      className="cursor-pointer"
                      required
                    />
                    {fieldErrors?.attachmentInvoice && (
                      <p className="text-xs text-destructive">
                        {fieldErrors.attachmentInvoice[0]}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Group 4: การเบิกจ่ายค่าสาธารณูปโภค */}
          <div className="space-y-4 rounded-xl border bg-card/50 p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-3">
              <Banknote className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg tracking-tight">
                การเบิกจ่ายค่าสาธารณูปโภค
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div className="grid gap-2">
                <Label>
                  สถานะการเบิกจ่าย <span className="text-destructive">*</span>
                </Label>
                <input
                  type="hidden"
                  name="paymentStatus"
                  value={paymentStatus}
                />
                <RadioGroup
                  value={paymentStatus}
                  onValueChange={setPaymentStatus}
                  name="paymentStatus"
                  className="flex flex-col space-y-2 mt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PENDING" id="payment_pending" />
                    <Label
                      htmlFor="payment_pending"
                      className="font-normal cursor-pointer"
                    >
                      ยังไม่ได้เบิกจ่าย
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="PAID"
                      id="payment_paid"
                      disabled={invoiceStatus === "NOT_RECEIVED"}
                    />
                    <Label
                      htmlFor="payment_paid"
                      className={`font-normal cursor-pointer ${invoiceStatus === "NOT_RECEIVED" ? "text-muted-foreground opacity-50" : ""}`}
                    >
                      เบิกจ่ายแล้ว
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {paymentStatus === "PAID" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-dashed mt-2">
                    <div className="grid gap-2">
                      <Label htmlFor="paymentDate">
                        วันที่เอกสาร <span className="text-destructive">*</span>
                      </Label>
                      <DatePickerBE
                        id="paymentDate"
                        name="paymentDate"
                        required={true}
                      />
                      {fieldErrors?.paymentDate && (
                        <p className="text-xs text-destructive">
                          {fieldErrors.paymentDate[0]}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="costCenterCode">
                        รหัสศูนย์ต้นทุน <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="costCenterCode"
                        name="costCenterCode"
                        value={costCenterCode || ""}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                        placeholder="ดึงจากหน่วยงานอัตโนมัติ"
                      />
                      {!costCenterCode && paymentStatus === "PAID" && (
                        <p className="text-xs text-destructive">
                          * ไม่พบรหัสศูนย์ต้นทุน
                          กรุณาตรวจสอบข้อมูลหน่วยงานหรือระบุหน่วยงานที่รับฝากเบิก
                        </p>
                      )}
                      {fieldErrors?.costCenterCode && (
                        <p className="text-xs text-destructive">
                          {fieldErrors.costCenterCode[0]}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="budgetCode">
                        รหัสงบประมาณ <span className="text-destructive">*</span>
                      </Label>
                      {sortedBudgetCodes.length > 0 ? (
                        <>
                          <input
                            type="hidden"
                            name="budgetCode"
                            value={budgetCode}
                          />
                          <Select
                            value={budgetCode}
                            onValueChange={(val) => val && setBudgetCode(val)}
                          >
                            <SelectTrigger id="budgetCode" className="w-full">
                              <SelectValue placeholder="-- เลือกรหัสงบประมาณ --">
                                {budgetCode
                                  ? (() => {
                                      const match = sortedBudgetCodes.find(
                                        (b) => b.code === budgetCode,
                                      );
                                      return match
                                        ? `${match.code} (พ.ศ. ${match.fiscalYear})${match.description ? ` - ${match.description}` : ""}`
                                        : budgetCode;
                                    })()
                                  : "-- เลือกรหัสงบประมาณ --"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {sortedBudgetCodes.map((b) => (
                                <SelectItem key={b.id} value={b.code}>
                                  <span className="font-mono font-semibold mr-1.5">
                                    {b.code}
                                  </span>{" "}
                                  (พ.ศ. {b.fiscalYear})
                                  {b.description ? ` - ${b.description}` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      ) : (
                        <Input
                          type="text"
                          id="budgetCode"
                          name="budgetCode"
                          value={budgetCode}
                          onChange={(e) => setBudgetCode(e.target.value)}
                          placeholder="เช่น 2800100000000000"
                          required={true}
                        />
                      )}
                      {fieldErrors?.budgetCode && (
                        <p className="text-xs text-destructive">
                          {fieldErrors.budgetCode[0]}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="paymentDocNumber">
                        เลขเอกสาร <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="paymentDocNumber"
                        name="paymentDocNumber"
                        defaultValue=""
                        placeholder="เช่น 3100011102"
                        required={true}
                      />
                      {fieldErrors?.paymentDocNumber && (
                        <p className="text-xs text-destructive">
                          {fieldErrors.paymentDocNumber[0]}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="docType">
                        ประเภทเอกสาร <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="docType"
                        name="docType"
                        defaultValue=""
                        placeholder="เช่น KC"
                        required={true}
                      />
                      {fieldErrors?.docType && (
                        <p className="text-xs text-destructive">
                          {fieldErrors.docType[0]}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="accountCode">
                        รหัสแยกประเภท<span className="text-destructive">*</span>
                      </Label>
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
                      {fieldErrors?.accountCode && (
                        <p className="text-xs text-destructive">
                          {fieldErrors.accountCode[0]}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <Label htmlFor="paidAmount">
                          จำนวนเงินที่เบิกจ่าย (บาท){" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        {maxReimbursableAmount !== null &&
                          maxReimbursableAmount > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setPaidAmountVal(
                                  maxReimbursableAmount.toFixed(2),
                                )
                              }
                              className="text-xs text-primary hover:underline font-medium"
                            >
                              ใช้ยอดสิทธิเบิกได้จริง (฿
                              {maxReimbursableAmount.toFixed(2)})
                            </button>
                          )}
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        id="paidAmount"
                        name="paidAmount"
                        value={paidAmountVal}
                        onChange={(e) => setPaidAmountVal(e.target.value)}
                        placeholder="0.00"
                        required={true}
                        className={
                          isPaidOverLimit
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />
                      {isPaidOverLimit && (
                        <p className="text-xs text-destructive font-medium">
                          ⚠️ เกินสิทธิที่เบิกจ่ายได้จริง (สูงสุด ฿
                          {maxReimbursableAmount?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}{" "}
                          บาท)
                        </p>
                      )}
                      {fieldErrors?.paidAmount && (
                        <p className="text-xs text-destructive">
                          {fieldErrors.paidAmount[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-dashed">
                    <div className="flex items-center gap-2 mb-4">
                      <UploadCloud className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-md tracking-tight">
                        ไฟล์แนบหลักฐาน
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="grid gap-2 bg-background p-3 rounded-lg border border-dashed">
                        <Label
                          htmlFor="attachmentReceipt"
                          className="font-medium"
                        >
                          ใบเสร็จรับเงิน{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="file"
                          id="attachmentReceipt"
                          name="attachmentReceipt"
                          accept="image/*,.pdf"
                          className="cursor-pointer file:cursor-pointer text-xs"
                          required={true}
                        />
                      </div>

                      <div className="grid gap-2 bg-background p-3 rounded-lg border border-dashed">
                        <Label
                          htmlFor="attachmentDirectPayment"
                          className="font-medium"
                        >
                          รายงานจ่ายตรง / รายงาน KTB{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="file"
                          id="attachmentDirectPayment"
                          name="attachmentDirectPayment"
                          accept="image/*,.pdf"
                          className="cursor-pointer file:cursor-pointer text-xs"
                          required={true}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 bg-muted/50 p-4 rounded-b-xl border-t mt-4">
          <Button
            variant="outline"
            type="button"
            onClick={() => window.history.back()}
          >
            ยกเลิก
          </Button>
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

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Search,
  Calendar,
  AlertCircle,
  FileQuestion,
  Clock,
  CheckCircle2,
} from "lucide-react";

type TrackingData = {
  id: string;
  departmentId: string;
  departmentName: string;
  utilityType: string;
  provider: string;
  serviceNumber: string;
  amount: string;
  status:
    | "UNRECORDED"
    | "NOT_RECEIVED"
    | "PENDING_PAYMENT"
    | "PAID"
    | "UNKNOWN";
  isExpected: boolean;
  billId: string | null;
};

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const STATUS_CONFIG = {
  UNRECORDED: {
    label: "ยังไม่ได้บันทึก",
    color: "#f43f5e",
    variant: "destructive" as const,
  },
  NOT_RECEIVED: {
    label: "ยังไม่ได้รับใบแจ้งหนี้",
    color: "#f97316",
    variant: "warning" as const,
  },
  PENDING_PAYMENT: {
    label: "ยังไม่ได้เบิกจ่าย",
    color: "#eab308",
    variant: "secondary" as const,
  },
  PAID: {
    label: "เบิกจ่ายแล้ว",
    color: "#10b981",
    variant: "success" as const,
  },
  UNKNOWN: {
    label: "ไม่ทราบสถานะ",
    color: "#6b7280",
    variant: "outline" as const,
  },
};

export function TrackingDashboard({
  initialData,
  month,
  year,
}: {
  initialData: TrackingData[];
  month: number;
  year: number;
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ทุกสถานะ");

  const currentYearBE = new Date().getFullYear() + 543;
  const yearsBE = Array.from({ length: 5 }, (_, i) => currentYearBE - 2 + i);

  const handleMonthChange = (val: string | null) => {
    if (!val) return;
    router.push(`/bill-tracking?month=${val}&year=${year}`);
  };

  const handleYearChange = (val: string | null) => {
    if (!val) return;
    router.push(`/bill-tracking?month=${month}&year=${parseInt(val) - 543}`);
  };

  // Calculations
  const stats = useMemo(() => {
    return {
      total: initialData.length,
      unrecorded: initialData.filter((d) => d.status === "UNRECORDED").length,
      notReceived: initialData.filter((d) => d.status === "NOT_RECEIVED")
        .length,
      pending: initialData.filter((d) => d.status === "PENDING_PAYMENT").length,
      paid: initialData.filter((d) => d.status === "PAID").length,
    };
  }, [initialData]);

  const pieData = useMemo(
    () =>
      [
        {
          name: STATUS_CONFIG.UNRECORDED.label,
          value: stats.unrecorded,
          color: STATUS_CONFIG.UNRECORDED.color,
        },
        {
          name: STATUS_CONFIG.NOT_RECEIVED.label,
          value: stats.notReceived,
          color: STATUS_CONFIG.NOT_RECEIVED.color,
        },
        {
          name: STATUS_CONFIG.PENDING_PAYMENT.label,
          value: stats.pending,
          color: STATUS_CONFIG.PENDING_PAYMENT.color,
        },
        {
          name: STATUS_CONFIG.PAID.label,
          value: stats.paid,
          color: STATUS_CONFIG.PAID.color,
        },
      ].filter((d) => d.value > 0),
    [stats],
  );

  const barData = useMemo(() => {
    const utilityTypes = Array.from(
      new Set(initialData.map((d) => d.utilityType)),
    );
    return utilityTypes.map((type) => {
      const bills = initialData.filter((d) => d.utilityType === type);
      return {
        name: type,
        ยังไม่ได้บันทึก: bills.filter((d) => d.status === "UNRECORDED").length,
        ยังไม่ได้รับใบแจ้งหนี้: bills.filter((d) => d.status === "NOT_RECEIVED")
          .length,
        ยังไม่ได้เบิกจ่าย: bills.filter((d) => d.status === "PENDING_PAYMENT")
          .length,
        เบิกจ่ายแล้ว: bills.filter((d) => d.status === "PAID").length,
      };
    });
  }, [initialData]);

  const filteredData = useMemo(() => {
    return initialData.filter((item) => {
      const matchStatus =
        statusFilter === "ทุกสถานะ" || item.status === statusFilter;
      const matchSearch =
        searchTerm === "" ||
        item.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serviceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.utilityType.toLowerCase().includes(searchTerm.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [initialData, statusFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Month/Year Filter Card */}
      <div className="p-4 rounded-2xl bg-card/85 dark:bg-card/70 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Calendar className="size-4 text-primary" />
          <span>เลือกรอบบิลที่ต้องการติดตาม:</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Select value={month.toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[160px] h-9.5 rounded-xl text-xs">
              <SelectValue placeholder="เลือกเดือน">
                {THAI_MONTHS[month - 1]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {THAI_MONTHS.map((m, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={(year + 543).toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-[110px] h-9.5 rounded-xl text-xs">
              <SelectValue placeholder="เลือกปี">
                {year + 543}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {yearsBE.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Metric Widget Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="apple-card-hover border-black/[0.06] dark:border-white/[0.08]">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground tracking-wide">
                ยังไม่ได้บันทึก
              </span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                <AlertCircle className="size-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                {stats.unrecorded}
                <span className="text-sm font-normal text-muted-foreground ml-1.5">
                  รายการ
                </span>
              </div>
              <p className="text-xs text-muted-foreground/80 mt-1">
                รายการที่คาดหวังแต่ไม่พบในระบบ
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="apple-card-hover border-black/[0.06] dark:border-white/[0.08]">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground tracking-wide">
                ยังไม่ได้รับใบแจ้งหนี้
              </span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <FileQuestion className="size-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {stats.notReceived}
                <span className="text-sm font-normal text-muted-foreground ml-1.5">
                  รายการ
                </span>
              </div>
              <p className="text-xs text-muted-foreground/80 mt-1">
                บันทึกแล้วแต่รอใบเสร็จ/แจ้งหนี้
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="apple-card-hover border-black/[0.06] dark:border-white/[0.08]">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground tracking-wide">
                ยังไม่ได้เบิกจ่าย
              </span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <Clock className="size-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {stats.pending}
                <span className="text-sm font-normal text-muted-foreground ml-1.5">
                  รายการ
                </span>
              </div>
              <p className="text-xs text-muted-foreground/80 mt-1">
                ได้รับใบแจ้งหนี้ รอทำเรื่องจ่าย
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="apple-card-hover border-black/[0.06] dark:border-white/[0.08]">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground tracking-wide">
                เบิกจ่ายแล้ว
              </span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <CheckCircle2 className="size-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {stats.paid}
                <span className="text-sm font-normal text-muted-foreground ml-1.5">
                  รายการ
                </span>
              </div>
              <p className="text-xs text-muted-foreground/80 mt-1">
                ชำระเงินเรียบร้อย
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-black/[0.06] dark:border-white/[0.08]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold tracking-tight">สัดส่วนสถานะบิล</CardTitle>
            <CardDescription>ภาพรวมของบิลทั้งหมดในเดือนนี้</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {stats.total === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                ไม่มีข้อมูล
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="transparent"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} รายการ`, "จำนวน"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-black/[0.06] dark:border-white/[0.08]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold tracking-tight">สถานะแยกตามประเภท</CardTitle>
            <CardDescription>การแจกแจงตามประเภทสาธารณูปโภค</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {stats.total === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                ไม่มีข้อมูล
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    opacity={0.2}
                  />
                  <XAxis dataKey="name" className="text-[11px]" />
                  <YAxis allowDecimals={false} className="text-[11px]" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="ยังไม่ได้บันทึก"
                    stackId="a"
                    fill={STATUS_CONFIG.UNRECORDED.color}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="ยังไม่ได้รับใบแจ้งหนี้"
                    stackId="a"
                    fill={STATUS_CONFIG.NOT_RECEIVED.color}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="ยังไม่ได้เบิกจ่าย"
                    stackId="a"
                    fill={STATUS_CONFIG.PENDING_PAYMENT.color}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="เบิกจ่ายแล้ว"
                    stackId="a"
                    fill={STATUS_CONFIG.PAID.color}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Table Card */}
      <Card className="border-black/[0.06] dark:border-white/[0.08]">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold tracking-tight">
                รายละเอียดรายการ ({filteredData.length} รายการ)
              </CardTitle>
              <CardDescription>
                แสดงรายการบิลและสถานะความคืบหน้ารายหน่วยงาน
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative w-full sm:w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="ค้นหาชื่อหน่วยงาน, หมายเลข..."
                  className="pl-9 h-9.5 rounded-xl bg-background/60 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => v && setStatusFilter(v)}
              >
                <SelectTrigger className="w-full sm:w-[170px] h-9.5 rounded-xl text-xs">
                  <SelectValue placeholder="ทุกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ทุกสถานะ">ทุกสถานะ</SelectItem>
                  <SelectItem value="UNRECORDED">ยังไม่ได้บันทึก</SelectItem>
                  <SelectItem value="NOT_RECEIVED">ยังไม่ได้รับใบแจ้งหนี้</SelectItem>
                  <SelectItem value="PENDING_PAYMENT">ยังไม่ได้เบิกจ่าย</SelectItem>
                  <SelectItem value="PAID">เบิกจ่ายแล้ว</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>หน่วยงาน</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>ผู้ให้บริการ</TableHead>
                  <TableHead>หมายเลขผู้ใช้</TableHead>
                  <TableHead className="text-right">ยอดเงิน</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-28 text-center text-muted-foreground text-sm">
                      ไม่พบข้อมูลที่ตรงกับเงื่อนไข
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id} className="group">
                      <TableCell className="font-medium text-foreground text-xs sm:text-sm">
                        {item.departmentName}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.utilityType}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.provider}</TableCell>
                      <TableCell className="text-xs font-mono text-foreground/90">{item.serviceNumber}</TableCell>
                      <TableCell className="text-right font-semibold text-xs text-foreground">
                        {item.amount !== "0" && item.amount !== "0.00"
                          ? parseFloat(item.amount).toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={STATUS_CONFIG[item.status].variant}
                          className="text-[10px] h-5 font-normal"
                        >
                          {STATUS_CONFIG[item.status].label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


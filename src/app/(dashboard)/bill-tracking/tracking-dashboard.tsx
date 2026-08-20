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
import { Search } from "lucide-react";

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
    color: "#ef4444",
    bgClass:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200",
  },
  NOT_RECEIVED: {
    label: "ยังไม่ได้รับใบแจ้งหนี้",
    color: "#f97316",
    bgClass:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200",
  },
  PENDING_PAYMENT: {
    label: "ยังไม่ได้เบิกจ่าย",
    color: "#eab308",
    bgClass:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200",
  },
  PAID: {
    label: "เบิกจ่ายแล้ว",
    color: "#22c55e",
    bgClass:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200",
  },
  UNKNOWN: {
    label: "ไม่ทราบสถานะ",
    color: "#6b7280",
    bgClass:
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200",
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
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="text-sm font-medium whitespace-nowrap">
              เลือกเดือน/ปี:
            </div>
            <Select value={month.toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="เลือกเดือน" />
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
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="เลือกปี" />
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ยังไม่ได้บันทึก
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {stats.unrecorded}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              รายการที่คาดหวังแต่ไม่พบในระบบ
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ยังไม่ได้รับใบแจ้งหนี้
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {stats.notReceived}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              บันทึกแล้วแต่รอใบเสร็จ/แจ้งหนี้
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ยังไม่ได้เบิกจ่าย
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.pending}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ได้รับใบแจ้งหนี้ รอทำเรื่องจ่าย
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              เบิกจ่ายแล้ว
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.paid}
            </div>
            <p className="text-xs text-muted-foreground mt-1">ชำระเงินเรียบร้อย</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>สัดส่วนสถานะบิล</CardTitle>
            <CardDescription>ภาพรวมของบิลทั้งหมดในเดือนนี้</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {stats.total === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
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
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
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

        <Card>
          <CardHeader>
            <CardTitle>สถานะแยกตามประเภท</CardTitle>
            <CardDescription>การแจกแจงตามประเภทสาธารณูปโภค</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {stats.total === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
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
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="ยังไม่ได้บันทึก"
                    stackId="a"
                    fill={STATUS_CONFIG.UNRECORDED.color}
                  />
                  <Bar
                    dataKey="ยังไม่ได้รับใบแจ้งหนี้"
                    stackId="a"
                    fill={STATUS_CONFIG.NOT_RECEIVED.color}
                  />
                  <Bar
                    dataKey="ยังไม่ได้เบิกจ่าย"
                    stackId="a"
                    fill={STATUS_CONFIG.PENDING_PAYMENT.color}
                  />
                  <Bar
                    dataKey="เบิกจ่ายแล้ว"
                    stackId="a"
                    fill={STATUS_CONFIG.PAID.color}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายละเอียดรายการ ({filteredData.length} รายการ)</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="ค้นหาชื่อหน่วยงาน, ประเภท, หรือเลขหมาย..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => v && setStatusFilter(v)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
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
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>หน่วยงาน</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>ผู้ให้บริการ</TableHead>
                  <TableHead>หมายเลขผู้ใช้</TableHead>
                  <TableHead className="text-right">ยอดเงิน</TableHead>
                  <TableHead>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.departmentName}
                      </TableCell>
                      <TableCell>{item.utilityType}</TableCell>
                      <TableCell>{item.provider}</TableCell>
                      <TableCell>{item.serviceNumber}</TableCell>
                      <TableCell className="text-right">
                        {item.amount !== "0" && item.amount !== "0.00"
                          ? parseFloat(item.amount).toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_CONFIG[item.status].bgClass}
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

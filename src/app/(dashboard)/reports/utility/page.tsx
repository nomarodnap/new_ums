import { db } from "@/server/db";
import { utilityBills, departments } from "@/server/db/schema";
import { eq, desc, sum, sql } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import Image from "next/image";

export default async function UtilityReportPage() {
  // Aggregate by department and utility type
  const reportData = await db
    .select({
      departmentName: departments.fullName,
      utilityType: utilityBills.utilityType,
      totalAmount: sum(utilityBills.invoiceAmount),
      billCount: sql`count(*)`.mapWith(Number),
    })
    .from(utilityBills)
    .innerJoin(departments, eq(utilityBills.departmentId, departments.id))
    .where(eq(utilityBills.isPendingBillOnly, false))
    .groupBy(departments.fullName, utilityBills.utilityType)
    .orderBy(departments.fullName);

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center">
            <Image
              src="/logo.png"
              alt="ตราสัญลักษณ์กรมประมง"
              width={48}
              height={48}
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              รายงานค่าสาธารณูปโภค
            </h2>
            <p className="text-muted-foreground mt-1">
              สรุปการเบิกจ่ายค่าสาธารณูปโภคแยกตามหน่วยงานและประเภท
            </p>
          </div>
        </div>
        <Button variant="outline" className="print:hidden">
          <Printer className="mr-2 h-4 w-4" /> พิมพ์รายงาน
        </Button>
      </div>

      <div className="rounded-md border bg-card print:border-none print:shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>หน่วยงาน</TableHead>
              <TableHead>ประเภทสาธารณูปโภค</TableHead>
              <TableHead className="text-right">จำนวนบิล (ใบ)</TableHead>
              <TableHead className="text-right">ยอดรวมที่เบิกจ่าย (บาท)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center h-24 text-muted-foreground"
                >
                  ไม่มีข้อมูล
                </TableCell>
              </TableRow>
            )}
            {reportData.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">
                  {row.departmentName}
                </TableCell>
                <TableCell>{row.utilityType}</TableCell>
                <TableCell className="text-right">{row.billCount}</TableCell>
                <TableCell className="text-right font-medium">
                  {row.totalAmount
                    ? Number(row.totalAmount).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })
                    : "0.00"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

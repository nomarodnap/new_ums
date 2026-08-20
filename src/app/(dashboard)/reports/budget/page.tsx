import { db } from "@/server/db";
import { budgets, departments } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer, AlertTriangle } from "lucide-react";
import Image from "next/image";

export default async function BudgetReportPage() {
  const reportData = await db
    .select({
      departmentName: departments.fullName,
      allocatedAmount: budgets.allocatedAmount,
      usedAmount: budgets.transferredAmount,
      fiscalYear: budgets.fiscalYear,
    })
    .from(budgets)
    .innerJoin(departments, eq(budgets.departmentId, departments.id))
    .orderBy(desc(budgets.fiscalYear), departments.fullName);

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
              รายงานการบริหารงบประมาณ
            </h2>
            <p className="text-muted-foreground mt-1">
              เปรียบเทียบงบประมาณจัดสรร งบใช้ไป และงบคงเหลือรายหน่วยงาน
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
              <TableHead>ปีงบประมาณ</TableHead>
              <TableHead>หน่วยงาน</TableHead>
              <TableHead className="text-right">งบประมาณจัดสรร</TableHead>
              <TableHead className="text-right">เบิกจ่ายไปแล้ว</TableHead>
              <TableHead className="text-right">คงเหลือ</TableHead>
              <TableHead className="text-center">สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center h-24 text-muted-foreground"
                >
                  ไม่มีข้อมูลการตั้งงบประมาณ
                </TableCell>
              </TableRow>
            )}
            {reportData.map((row, idx) => {
              const allocated = Number(row.allocatedAmount || 0);
              const used = Number(row.usedAmount || 0);
              const remaining = allocated - used;
              const isWarning = remaining < allocated * 0.2; // น้อยกว่า 20%

              return (
                <TableRow key={idx} className={isWarning ? "bg-red-50/50" : ""}>
                  <TableCell>{row.fiscalYear}</TableCell>
                  <TableCell className="font-medium">
                    {row.departmentName}
                  </TableCell>
                  <TableCell className="text-right">
                    {allocated.toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    {used.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell
                    className={`text-right font-bold ${remaining < 0 ? "text-red-600" : ""}`}
                  >
                    {remaining.toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-center">
                    {isWarning ? (
                      <span className="inline-flex items-center text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
                        <AlertTriangle className="w-3 h-3 mr-1" /> งบใกล้หมด
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        ปกติ
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

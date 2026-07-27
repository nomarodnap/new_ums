"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

export type RecentAnomaly = {
  id: string
  departmentName: string | null
  utilityType: string
  billingMonth: number
  billingYear: number
  invoiceAmount: string | null
  isManualAnomaly: boolean | null
  manualAnomalyReason: string | null
  isLateReceive: boolean | null
  isLatePayment: boolean | null
}

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]

export function RecentAnomaliesTable({ anomalies }: { anomalies: RecentAnomaly[] }) {
  if (anomalies.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        ไม่พบรายการผิดปกติในช่วงนี้
      </div>
    )
  }

  const formatCurrency = (amount: string | null | undefined) => {
    if (!amount) return "-"
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(amount))
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>หน่วยงาน</TableHead>
            <TableHead>ประเภท</TableHead>
            <TableHead>รอบบิล</TableHead>
            <TableHead className="text-right">ยอดชำระ</TableHead>
            <TableHead>ปัญหาที่พบ</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {anomalies.map((anomaly) => {
            const issues = []
            if (anomaly.isManualAnomaly) issues.push(anomaly.manualAnomalyReason || "ผิดปกติ (ระบุเอง)")
            if (anomaly.isLateReceive) issues.push("ลงรับบิลล่าช้า")
            if (anomaly.isLatePayment) issues.push("จ่ายล่าช้า")
            
            return (
              <TableRow key={anomaly.id}>
                <TableCell className="font-medium max-w-[200px] truncate" title={anomaly.departmentName || ""}>
                  {anomaly.departmentName || "ไม่ระบุ"}
                </TableCell>
                <TableCell>{anomaly.utilityType}</TableCell>
                <TableCell>{THAI_MONTHS[anomaly.billingMonth - 1]} {anomaly.billingYear + 543}</TableCell>
                <TableCell className="text-right">{formatCurrency(anomaly.invoiceAmount)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {issues.map((issue, idx) => (
                      <Badge key={idx} variant="destructive" className="text-[10px] whitespace-nowrap">
                        {issue}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Link href="/all-bills" className="text-muted-foreground hover:text-primary">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

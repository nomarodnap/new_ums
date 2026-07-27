import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Lock } from "lucide-react"
import Link from "next/link"
import { requireRole } from "@/server/auth"

const reportList = [
  {
    id: "utility",
    title: "1. รายงานค่าสาธารณูปโภค",
    description: "แสดงงบประมาณจัดสรร ผลเบิกจ่าย งบพึงประสงค์ เปรียบเทียบรายกอง/รายหน่วยงาน (รายเดือนและรายปี)",
    href: "/reports/utility",
    allowedRoles: ["staff", "supervisor", "admin"],
  },
  {
    id: "pending",
    title: "2. รายงานค่าสาธารณูปโภคค้างชำระ",
    description: "สรุปรายการบิลค้างชำระ ยอดประมาณการที่อยู่ระหว่างขอจัดสรรงบ",
    href: "/reports/pending",
    allowedRoles: ["staff", "supervisor", "admin"],
  },
  {
    id: "budget",
    title: "3. รายงานการบริหารงบประมาณ",
    description: "เปรียบเทียบงบประมาณคงเหลือ และวิเคราะห์รายชื่อหน่วยงานที่งบประมาณมีแนวโน้มไม่เพียงพอ",
    href: "/reports/budget",
    allowedRoles: ["staff", "supervisor", "admin"],
  },
  {
    id: "audit-results",
    title: "4. รายงานผลการตรวจสอบค่าสาธารณูปโภค",
    description: "รายงานประเด็นความคลาดเคลื่อน เทียบกับปีก่อนหน้า และติดตามการแก้ไขตามข้อเสนอแนะ",
    href: "/reports/audit-results",
    allowedRoles: ["staff", "supervisor", "admin"],
  },
  {
    id: "audit-summary",
    title: "5. รายงานสรุปการเบิกจ่าย (สำหรับ กตน.)",
    description: "รายงานสำหรับกลุ่มตรวจสอบภายในเท่านั้น แสดงรายละเอียดบิลและหมายเลขผู้ใช้",
    href: "/reports/audit-summary",
    allowedRoles: ["supervisor", "admin"], // กตน.
  },
  {
    id: "finance-control",
    title: "6. ทะเบียนคุมการเบิกจ่าย (สำหรับ กค.)",
    description: "ทะเบียนคุมการเบิกจ่ายของกองบริหารการคลัง แสดงวันรับเรื่องและเลขที่ใบสำคัญ",
    href: "/reports/finance-control",
    allowedRoles: ["admin"], // กค.
  },
  {
    id: "additional-budget",
    title: "7. แบบฟอร์มขอรับงบจัดสรรเพิ่มเติม (สำหรับ กยผ.)",
    description: "แบบฟอร์มคำขอสำหรับหน่วยงานที่งบประมาณไม่เพียงพอ",
    href: "/reports/additional-budget",
    allowedRoles: ["admin"], // กยผ.
  },
  {
    id: "audit-worksheet",
    title: "8. กระดาษทำการตรวจสอบค่าสาธารณูปโภค (สำหรับ กตน.)",
    description: "เอกสารสรุปจำนวนวันตั้งแต่รับบิลจนถึงเบิกจ่าย เพื่อหากรณีเบิกจ่ายล่าช้า",
    href: "/reports/audit-worksheet",
    allowedRoles: ["supervisor", "admin"], // กตน.
  },
]

export default async function ReportsCenterPage() {
  const session = await requireRole(["admin", "auditor", "strategy_finance", "central_staff", "regional_staff"]);
  const userRole = session.user.role;

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">ศูนย์รวมรายงาน (Report Center)</h2>
      </div>
      
      <p className="text-muted-foreground mb-6">
        ระบบออกรายงานการบริหารจัดการค่าสาธารณูปโภค 8 รูปแบบ โดยสิทธิ์การเข้าถึงรายงานจะขึ้นอยู่กับบทบาทและสังกัดของคุณ
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportList.map((report) => {
          const isAllowed = report.allowedRoles.includes(userRole);
          
          return (
            <Card key={report.id} className={`transition-all ${isAllowed ? 'hover:border-primary/50 hover:shadow-md' : 'opacity-70 bg-muted/30'}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className={`p-2 rounded-lg ${isAllowed ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {isAllowed ? <FileText className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  {!isAllowed && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      No Access
                    </span>
                  )}
                </div>
                <CardTitle className="text-lg mt-4 leading-tight">{report.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-3">
                  {report.description}
                </CardDescription>
                
                <div className="mt-6">
                  {isAllowed ? (
                    <Link 
                      href={report.href} 
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      เรียกดูรายงาน &rarr;
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground cursor-not-allowed">
                      เฉพาะเจ้าหน้าที่ที่เกี่ยวข้อง
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, CreditCard, Zap, AlertTriangle, Building, ArrowRight, PlusCircle, FileText } from "lucide-react"
import { TrendChart, StatusPieChart } from "@/components/dashboard/dashboard-charts"
import { RecentAnomaliesTable } from "@/components/dashboard/recent-anomalies-table"
import Link from "next/link"
import { getDashboardStats } from "@/server/actions/dashboard"
import { Button } from "@/components/ui/button"

export default async function DashboardOverview() {
  const stats = await getDashboardStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount)
  }

  return (
    <>
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
        <p className="text-muted-foreground">ภาพรวมการบริหารจัดการค่าสาธารณูปโภค {stats.isAdmin ? "(ทั้งหมด)" : "(หน่วยงานของคุณ)"}</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="border-blue-200 dark:border-blue-800/50 dark:bg-slate-900/50 backdrop-blur-md transition-all duration-300 hover:shadow-lg dark:hover:shadow-blue-900/20 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-50/50 dark:bg-blue-900/20">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">บิลที่บันทึกเข้าระบบ (เดือนนี้)</CardTitle>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.totalInvoicesCurrentMonth.toLocaleString()} รายการ</div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 dark:border-green-800/50 dark:bg-slate-900/50 backdrop-blur-md transition-all duration-300 hover:shadow-lg dark:hover:shadow-green-900/20 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-green-50/50 dark:bg-green-900/20">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300">เบิกจ่ายแล้ว (เดือนนี้)</CardTitle>
            <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPaidCurrentMonth)}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800/50 dark:bg-slate-900/50 backdrop-blur-md transition-all duration-300 hover:shadow-lg dark:hover:shadow-orange-900/20 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-orange-50/50 dark:bg-orange-900/20">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-300">ค้างชำระ (ทั้งหมด)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">{stats.totalPendingBills.toLocaleString()} รายการ</div>
            <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">
              <Link href="/bills" className="hover:underline inline-flex items-center">
                จัดการรายการเบิกจ่าย <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card className={stats.totalAnomalies > 0 ? "border-red-200 dark:border-red-800/50 dark:bg-slate-900/50 backdrop-blur-md transition-all duration-300 hover:shadow-lg dark:hover:shadow-red-900/20 hover:-translate-y-1" : "border-slate-200 dark:border-slate-800/50 dark:bg-slate-900/50 backdrop-blur-md transition-all duration-300 hover:shadow-lg dark:hover:shadow-slate-800/50 hover:-translate-y-1"}>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${stats.totalAnomalies > 0 ? "bg-red-50/50 dark:bg-red-900/20" : "bg-slate-50/50 dark:bg-slate-800/50"}`}>
            <CardTitle className={`text-sm font-medium ${stats.totalAnomalies > 0 ? "text-red-800 dark:text-red-300" : "text-slate-800 dark:text-slate-300"}`}>ตรวจสอบพบความผิดปกติ</CardTitle>
            <Activity className={`h-4 w-4 ${stats.totalAnomalies > 0 ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"}`} />
          </CardHeader>
          <CardContent className="pt-4">
            <div className={`text-2xl font-bold ${stats.totalAnomalies > 0 ? "text-red-700 dark:text-red-400" : ""}`}>{stats.totalAnomalies.toLocaleString()} รายการ</div>
            <p className={`text-xs mt-1 ${stats.totalAnomalies > 0 ? "text-red-600/80 dark:text-red-400/80" : "text-muted-foreground"}`}>
              <Link href="/all-bills" className="hover:underline inline-flex items-center">
                ดูบิลทั้งหมด <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {!stats.isAdmin && (
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card className="bg-slate-50 border-slate-200 dark:bg-slate-900/80 dark:border-slate-800 backdrop-blur-sm transition-all duration-300 hover:shadow-md">
             <CardContent className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">เพิ่มบิลค่าใช้จ่ายใหม่</h3>
                  <p className="text-sm text-muted-foreground">บันทึกบิลค่าสาธารณูปโภคที่ได้รับเพื่อเตรียมเบิกจ่าย</p>
                </div>
                <Button 
                  render={<Link href="/bills" />} 
                  size="lg" 
                  className="w-full sm:w-auto shadow-sm"
                >
                  <PlusCircle className="mr-2 h-5 w-5" /> สร้างรายการบิล
                </Button>
             </CardContent>
          </Card>
          <Card className="bg-slate-50 border-slate-200 dark:bg-slate-900/80 dark:border-slate-800 backdrop-blur-sm transition-all duration-300 hover:shadow-md">
             <CardContent className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">จัดการหมายเลขผู้ใช้</h3>
                  <p className="text-sm text-muted-foreground">เพิ่มหรือแก้ไขรหัสเครื่องวัดและเบอร์โทรศัพท์ของหน่วยงาน</p>
                </div>
                <Button 
                  render={<Link href="/services" />} 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto bg-white dark:bg-slate-950 dark:hover:bg-slate-900 shadow-sm"
                >
                  <Building className="mr-2 h-5 w-5 text-muted-foreground" /> จัดการหมายเลขผู้ใช้
                </Button>
             </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-6">
        <Card className="col-span-1 md:col-span-2 lg:col-span-5">
          <CardHeader>
            <CardTitle>แนวโน้มการเบิกจ่ายค่าสาธารณูปโภค</CardTitle>
            <CardDescription>กราฟเปรียบเทียบค่าใช้จ่ายแต่ละประเภทสาธารณูปโภค</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.trendData.length > 0 ? (
              <TrendChart data={stats.trendData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">ไม่มีข้อมูลเพียงพอ</div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>สถานะบิลในระบบ</CardTitle>
            <CardDescription>สัดส่วนสถานะบิลทั้งหมด</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.statusData.some(d => d.value > 0) ? (
              <StatusPieChart data={stats.statusData} />
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">ไม่มีข้อมูล</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>รายการบิลที่พบความผิดปกติล่าสุด</CardTitle>
            <CardDescription>5 รายการล่าสุดที่ถูกปักธงหรือมีข้อมูลไม่สอดคล้อง</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentAnomaliesTable anomalies={stats.recentAnomalies as any} />
          </CardContent>
        </Card>

        {stats.isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>5 อันดับหน่วยงานที่เบิกจ่ายสูงสุด (สะสม)</CardTitle>
              <CardDescription>ยอดรวมเบิกจ่ายแล้วของแต่ละหน่วยงาน</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 mt-2">
                {stats.topDepartments.length > 0 ? stats.topDepartments.map((dept, i) => {
                  // Calculate a relative percentage just for visual bar
                  const maxAmount = Math.max(...stats.topDepartments.map(d => Number(d.amount)));
                  const percentage = maxAmount > 0 ? (Number(dept.amount) / maxAmount) * 100 : 0;
                  
                  return (
                    <div key={i} className="flex items-center">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mr-4 text-primary font-bold">
                        {i + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium leading-none">{dept.name}</p>
                          <p className="text-sm font-medium">{formatCurrency(Number(dept.amount))}</p>
                        </div>
                        <div className="w-full bg-secondary/50 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-primary to-teal-400 dark:from-primary dark:to-cyan-400 h-full rounded-full transition-all duration-500 ease-in-out" 
                            style={{ width: `${percentage}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  )
                }) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                    ไม่มีข้อมูลการเบิกจ่าย
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  CreditCard,
  Zap,
  AlertTriangle,
  Building,
  ArrowRight,
  PlusCircle,
  FileText,
  FilePlus2,
  Bell,
  Sparkles,
} from "lucide-react";
import {
  TrendChart,
  StatusPieChart,
} from "@/components/dashboard/dashboard-charts";
import { RecentAnomaliesTable } from "@/components/dashboard/recent-anomalies-table";
import Link from "next/link";
import { getDashboardStats } from "@/server/actions/dashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function DashboardOverview() {
  const stats = await getDashboardStats("department");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">แดชบอร์ดหน่วยงาน</h1>
          <p className="text-muted-foreground mt-1">
            ภาพรวมการบริหารจัดการค่าสาธารณูปโภค —{" "}
            <span className="font-semibold text-foreground">
              {stats.departmentName || "หน่วยงานของคุณ"}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            render={<Link href="/bills/new" />}
            className="gap-2 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            <PlusCircle className="h-4 w-4" /> บันทึกบิลใหม่
          </Button>

          {stats.isAdmin && (
            <Button
              render={<Link href="/overview" />}
              variant="outline"
              className="gap-2 border-primary/30 hover:border-primary text-primary"
            >
              <Building className="h-4 w-4" /> ดูแดชบอร์ดภาพรวม
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="border-blue-200 dark:border-blue-800/50 dark:bg-slate-900/50 backdrop-blur-md transition-all duration-300 hover:shadow-lg dark:hover:shadow-blue-900/20 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-50/50 dark:bg-blue-900/20">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">
              บิลที่บันทึกเข้าระบบ (เดือนนี้)
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {stats.totalInvoicesCurrentMonth.toLocaleString()} รายการ
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800/50 dark:bg-slate-900/50 backdrop-blur-md transition-all duration-300 hover:shadow-lg dark:hover:shadow-green-900/20 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-green-50/50 dark:bg-green-900/20">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300">
              เบิกจ่ายแล้ว (เดือนนี้)
            </CardTitle>
            <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalPaidCurrentMonth)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800/50 dark:bg-slate-900/50 backdrop-blur-md transition-all duration-300 hover:shadow-lg dark:hover:shadow-orange-900/20 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-orange-50/50 dark:bg-orange-900/20">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-300">
              ค้างชำระ (ทั้งหมด)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
              {stats.totalPendingBills.toLocaleString()} รายการ
            </div>
            <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">
              <Link
                href="/bills"
                className="hover:underline inline-flex items-center"
              >
                จัดการรายการเบิกจ่าย <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card
          className={
            stats.totalAnomalies > 0
              ? "border-red-200 dark:border-red-800/50 dark:bg-slate-900/50 backdrop-blur-md transition-all duration-300 hover:shadow-lg dark:hover:shadow-red-900/20 hover:-translate-y-1"
              : "border-slate-200 dark:border-slate-800/50 dark:bg-slate-900/50 backdrop-blur-md transition-all duration-300 hover:shadow-lg dark:hover:shadow-slate-800/50 hover:-translate-y-1"
          }
        >
          <CardHeader
            className={`flex flex-row items-center justify-between space-y-0 pb-2 ${stats.totalAnomalies > 0 ? "bg-red-50/50 dark:bg-red-900/20" : "bg-slate-50/50 dark:bg-slate-800/50"}`}
          >
            <CardTitle
              className={`text-sm font-medium ${stats.totalAnomalies > 0 ? "text-red-800 dark:text-red-300" : "text-slate-800 dark:text-slate-300"}`}
            >
              ตรวจสอบพบความผิดปกติ
            </CardTitle>
            <Activity
              className={`h-4 w-4 ${stats.totalAnomalies > 0 ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"}`}
            />
          </CardHeader>
          <CardContent className="pt-4">
            <div
              className={`text-2xl font-bold ${stats.totalAnomalies > 0 ? "text-red-700 dark:text-red-400" : ""}`}
            >
              {stats.totalAnomalies.toLocaleString()} รายการ
            </div>
            <p
              className={`text-xs mt-1 ${stats.totalAnomalies > 0 ? "text-red-600/80 dark:text-red-400/80" : "text-muted-foreground"}`}
            >
              <Link
                href={stats.isAdmin ? "/all-bills" : "/bills"}
                className="hover:underline inline-flex items-center"
              >
                ดูรายการบิล <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* เมนูลัดสำหรับเข้าถึงหน้าต่างๆ (User Role Shortcuts) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              เมนูลัดสำหรับหน่วยงาน (Quick Shortcuts)
            </h2>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            เข้าถึงฟังก์ชันงานหลักของหน่วยงานได้สะดวกรวดเร็ว
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/bills/new"
            className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-md dark:hover:border-emerald-500/30"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <FilePlus2 className="h-5 w-5" />
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50 font-medium"
                >
                  บันทึกข้อมูล
                </Badge>
              </div>
              <h3 className="font-semibold text-sm text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                บันทึกบิลใหม่
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                บันทึกใบแจ้งหนี้ค่าไฟฟ้า น้ำประปา โทรศัพท์ เพื่อขอเบิกจ่าย
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span>สร้างรายการ</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/bills"
            className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-md dark:hover:border-blue-500/30"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 group-hover:scale-105 transition-transform">
                  <FileText className="h-5 w-5" />
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50 font-medium"
                >
                  จัดการบิล
                </Badge>
              </div>
              <h3 className="font-semibold text-sm text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                รายการค่าใช้จ่ายหน่วยงาน
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                ตรวจสอบประวัติการเบิกจ่าย สถานะบิล และแก้ไขข้อมูล
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-blue-600 dark:text-blue-400">
              <span>ดูรายการบิล</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/services"
            className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-md dark:hover:border-amber-500/30"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <Activity className="h-5 w-5" />
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50 font-medium"
                >
                  ทะเบียนบริการ
                </Badge>
              </div>
              <h3 className="font-semibold text-sm text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                รหัสเครื่องวัด / เบอร์โทร
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                ทะเบียนเลขมิเตอร์ไฟฟ้า น้ำประปา และเบอร์โทรศัพท์ของหน่วยงาน
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-amber-600 dark:text-amber-400">
              <span>จัดการทะเบียน</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/notifications"
            className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-purple-500/50 hover:shadow-md dark:hover:border-purple-500/30"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 group-hover:scale-105 transition-transform">
                  <Bell className="h-5 w-5" />
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/50 font-medium"
                >
                  การแจ้งเตือน
                </Badge>
              </div>
              <h3 className="font-semibold text-sm text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                ศูนย์การแจ้งเตือน
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                ติดตามการแจ้งเตือนเตือนชำระบิลและแจ้งเตือนงบประมาณ
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-purple-600 dark:text-purple-400">
              <span>ดูการแจ้งเตือน</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-6">
        <Card className="col-span-1 md:col-span-2 lg:col-span-5">
          <CardHeader>
            <CardTitle>แนวโน้มการเบิกจ่ายค่าสาธารณูปโภคของหน่วยงาน</CardTitle>
            <CardDescription>
              กราฟเปรียบเทียบค่าใช้จ่ายแต่ละประเภทสาธารณูปโภค (12 เดือนย้อนหลัง)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.trendData.length > 0 ? (
              <TrendChart data={stats.trendData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                ไม่มีข้อมูลเพียงพอ
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>สถานะบิลของหน่วยงาน</CardTitle>
            <CardDescription>สัดส่วนสถานะบิลทั้งหมด</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.statusData.some((d) => d.value > 0) ? (
              <StatusPieChart data={stats.statusData} />
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                ไม่มีข้อมูล
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>รายการบิลที่พบความผิดปกติล่าสุดของหน่วยงาน</CardTitle>
            <CardDescription>
              5 รายการล่าสุดที่ถูกปักธงหรือมีข้อมูลไม่สอดคล้อง
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentAnomaliesTable anomalies={stats.recentAnomalies as any} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

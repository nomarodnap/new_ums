import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { NotificationBell } from "@/components/layout/notification-bell"
import { ThemeToggle } from "@/components/theme-toggle"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { db } from "@/server/db"
import { departments } from "@/server/db/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    redirect("/sign-in");
  }

  let departmentName = "ไม่ระบุหน่วยงาน";
  if (session.user.departmentId) {
    const dept = await db.query.departments.findFirst({
      where: eq(departments.id, session.user.departmentId)
    });
    if (dept) {
      departmentName = dept.fullName;
    }
  }

  const user = {
    name: session.user.name,
    department: departmentName,
    role: session.user.role,
  };

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md px-4 sticky top-0 z-10">
          <SidebarTrigger className="-ml-1" />
          <div className="mr-4 font-semibold text-lg text-primary bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-teal-400 dark:from-cyan-400 dark:to-teal-200">ระบบรายงานค่าสาธารณูปโภค</div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4 md:gap-8 md:p-8 bg-slate-50/50 dark:bg-gradient-to-b dark:from-slate-950 dark:to-slate-900 min-h-screen">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

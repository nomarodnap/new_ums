"use client"

import * as React from "react"
import {
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  Zap,
  Building,
  Wallet,
  LogOut,
  Activity,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

const data = {
  navMain: [
    {
      title: "แดชบอร์ด (Dashboard)",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "รายการค่าใช้จ่าย",
      url: "/bills",
      icon: FileText,
    },
    {
      title: "รายการค่าใช้จ่ายทั้งหมด",
      url: "/all-bills",
      icon: FileText,
    },
    {
      title: "รหัสเครื่องวัด / เบอร์โทร",
      url: "/services",
      icon: Activity,
    },
    {
      title: "ติดตามสถานะบิล",
      url: "/bill-tracking",
      icon: Activity,
    },
    {
      title: "ศูนย์รวมรายงาน",
      url: "/reports",
      icon: FileText,
    },
    {
      title: "จัดการหน่วยงาน",
      url: "/departments",
      icon: Building,
    },

    {
      title: "ตั้งค่าระบบ",
      url: "/settings",
      icon: Settings,
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string;
    department: string;
    role?: string;
  };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
          router.refresh();
        },
      },
    });
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Zap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">กรมประมง</span>
                  <span className="truncate text-xs">ระบบจัดการสาธารณูปโภค</span>
                </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>เมนูหลัก</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => {
                if (user?.role === 'user' && [
                  "รายการค่าใช้จ่ายทั้งหมด",
                  "ติดตามสถานะบิล",
                  "ศูนย์รวมรายงาน",
                  "จัดการหน่วยงาน",
                  "ตั้งค่าระบบ"
                ].includes(item.title)) {
                  return null;
                }
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton render={<Link href={item.url} />} isActive={pathname === item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {user && (
            <SidebarMenuItem>
              <div className="flex flex-col gap-1 px-3 py-2 mb-2 text-sm bg-muted/50 rounded-md">
                <span className="font-semibold text-foreground line-clamp-1">{user.name}</span>
                <span className="text-xs text-muted-foreground line-clamp-2">{user.department}</span>
              </div>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20">
              <LogOut className="mr-2 h-4 w-4" />
              <span>ออกจากระบบ</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarSeparator />
    </Sidebar>
  )
}

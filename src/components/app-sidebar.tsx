"use client";

import * as React from "react";
import {
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  Zap,
  Building,
  Building2,
  Wallet,
  LogOut,
  Activity,
  BarChart3,
} from "lucide-react";

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
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const navMain = [
  {
    title: "แดชบอร์ดหน่วยงาน",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "แดชบอร์ดภาพรวม",
    url: "/overview",
    icon: BarChart3,
    onlyAdmin: true,
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
    staffOnly: true,
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
    staffOnly: true,
  },
  {
    title: "ศูนย์รวมรายงาน",
    url: "/reports",
    icon: FileText,
    staffOnly: true,
  },
  {
    title: "จัดการหน่วยงาน",
    url: "/departments",
    icon: Building,
    staffOnly: true,
  },
  {
    title: "ตั้งค่าระบบ",
    url: "/settings",
    icon: Settings,
    staffOnly: true,
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string;
    department: string;
    role?: string;
  };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
          router.refresh();
        },
      },
    });
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-white p-1 shadow-xs dark:bg-slate-800 ring-1 ring-border/50 shrink-0">
                <Image
                  src="/logo.png"
                  alt="ตราสัญลักษณ์กรมประมง"
                  width={32}
                  height={32}
                  className="size-7 object-contain"
                  priority
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-foreground">
                  กรมประมง
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  ระบบจัดการสาธารณูปโภค
                </span>
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
              {navMain.map((item) => {
                const isAdmin = [
                  "admin",
                  "auditor",
                  "strategy_finance",
                  "central_staff",
                ].includes(user?.role || "");

                // Only admin role sees the Consolidated Overview Dashboard
                if (item.onlyAdmin && user?.role !== "admin") {
                  return null;
                }

                // General staff-only items
                if (item.staffOnly && !isAdmin) {
                  return null;
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      isActive={pathname === item.url}
                    >
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
                <span className="font-semibold text-foreground line-clamp-1">
                  {user.name}
                </span>
                <span className="text-xs text-muted-foreground line-clamp-2">
                  {user.department}
                </span>
              </div>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>ออกจากระบบ</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarSeparator />
    </Sidebar>
  );
}

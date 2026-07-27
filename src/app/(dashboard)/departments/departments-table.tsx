"use client";

import { useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DepartmentFormSheet } from "./department-form-sheet";
import { DepartmentUsersSheet } from "./department-users-sheet";
import { DepartmentServicesSheet } from "./department-services-sheet";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Edit, Users, Receipt } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteDepartment } from "@/server/actions/departments";

type Department = {
  id: string;
  costCenterCode: string | null;
  fullName: string;
  shortName: string | null;
  type: string | null;
  province: string | null;
  phone: string | null;
};

export function DepartmentsTable({ initialData, users, services = [] }: { initialData: Department[], users: any[], services?: any[] }) {
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [selectedDeptForUsers, setSelectedDeptForUsers] = useState<Department | null>(null);
  const [selectedDeptForServices, setSelectedDeptForServices] = useState<Department | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm("ยืนยันการลบหน่วยงานนี้? ข้อมูลที่เกี่ยวข้องอาจได้รับผลกระทบ")) {
      const res = await deleteDepartment(id);
      if (res?.error) {
        alert(res.error);
      }
    }
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>รหัสศูนย์ต้นทุน</TableHead>
            <TableHead>ชื่อหน่วยงาน</TableHead>
            <TableHead>ประเภท</TableHead>
            <TableHead>จังหวัด</TableHead>
            <TableHead>เบอร์โทรศัพท์</TableHead>
            <TableHead className="text-right w-[80px]">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                ไม่พบข้อมูลหน่วยงาน
              </TableCell>
            </TableRow>
          ) : (
            initialData.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell className="font-medium">{dept.costCenterCode || "-"}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{dept.fullName}</span>
                    {dept.shortName && <span className="text-xs text-muted-foreground">{dept.shortName}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {dept.type === "central" ? "ส่วนกลาง" : dept.type === "regional" ? "ส่วนภูมิภาค" : dept.type === "regional_central" ? "ส่วนกลางในภูมิภาค" : "-"}
                  </Badge>
                </TableCell>
                <TableCell>{dept.province || "-"}</TableCell>
                <TableCell>{dept.phone || "-"}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                      <span className="sr-only">เปิดเมนู</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>การจัดการ</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setEditingDept(dept)} className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" /> แก้ไขข้อมูล
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelectedDeptForUsers(dept)} className="cursor-pointer text-primary focus:text-primary">
                          <Users className="mr-2 h-4 w-4" /> จัดการบัญชีผู้ใช้งาน
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelectedDeptForServices(dept)} className="cursor-pointer text-blue-600 focus:text-blue-600">
                          <Receipt className="mr-2 h-4 w-4" /> จัดการหมายเลขผู้ใช้
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => handleDelete(dept.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> ลบหน่วยงาน
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {editingDept && (
        <DepartmentFormSheet 
          department={editingDept} 
          departments={initialData}
          open={editingDept !== null}
          onOpenChange={(open) => !open && setEditingDept(null)}
        />
      )}

      {selectedDeptForUsers && (
        <DepartmentUsersSheet
          department={selectedDeptForUsers}
          users={users.filter((u) => u.departmentId === selectedDeptForUsers.id)}
          open={!!selectedDeptForUsers}
          onOpenChange={(open) => { if (!open) setSelectedDeptForUsers(null) }}
        />
      )}

      {selectedDeptForServices && (
        <DepartmentServicesSheet
          department={selectedDeptForServices}
          services={services.filter((s) => s.departmentId === selectedDeptForServices.id)}
          open={!!selectedDeptForServices}
          onOpenChange={(open) => { if (!open) setSelectedDeptForServices(null) }}
        />
      )}
    </div>
  );
}

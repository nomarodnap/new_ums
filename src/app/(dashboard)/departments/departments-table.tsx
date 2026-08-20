"use client";

import { useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DepartmentFormSheet } from "./department-form-sheet";
import { DepartmentUsersSheet } from "./department-users-sheet";
import { DepartmentServicesSheet } from "./department-services-sheet";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Trash2,
  Edit,
  Users,
  Receipt,
  Search,
  Building2,
} from "lucide-react";
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

export function DepartmentsTable({
  initialData,
  users,
  services = [],
}: {
  initialData: Department[];
  users: any[];
  services?: any[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [selectedDeptForUsers, setSelectedDeptForUsers] =
    useState<Department | null>(null);
  const [selectedDeptForServices, setSelectedDeptForServices] =
    useState<Department | null>(null);

  const filteredData = initialData.filter((dept) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      term === "" ||
      (dept.fullName && dept.fullName.toLowerCase().includes(term)) ||
      (dept.shortName && dept.shortName.toLowerCase().includes(term)) ||
      (dept.costCenterCode &&
        dept.costCenterCode.toLowerCase().includes(term)) ||
      (dept.province && dept.province.toLowerCase().includes(term));

    const matchesType = typeFilter === "all" || dept.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (confirm("ยืนยันการลบหน่วยงานนี้? ข้อมูลที่เกี่ยวข้องอาจได้รับผลกระทบ")) {
      const res = await deleteDepartment(id);
      if (res?.error) {
        alert(res.error);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อหน่วยงาน, ชื่อย่อ หรือรหัสศูนย์ต้นทุน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="w-[180px]">
            <Select
              value={typeFilter}
              onValueChange={(val) => val && setTypeFilter(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="ประเภทหน่วยงาน">
                  {typeFilter === "all"
                    ? "ทุกประเภทหน่วยงาน"
                    : typeFilter === "central"
                      ? "ส่วนกลาง"
                      : typeFilter === "regional"
                        ? "ส่วนภูมิภาค"
                        : typeFilter === "regional_central"
                          ? "ส่วนกลางในภูมิภาค"
                          : typeFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภทหน่วยงาน</SelectItem>
                <SelectItem value="central">ส่วนกลาง</SelectItem>
                <SelectItem value="regional">ส่วนภูมิภาค</SelectItem>
                <SelectItem value="regional_central">ส่วนกลางในภูมิภาค</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-xs text-muted-foreground self-center shrink-0">
          พบ {filteredData.length} จาก {initialData.length} หน่วยงาน
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[160px]">รหัสศูนย์ต้นทุน</TableHead>
              <TableHead>ชื่อหน่วยงาน</TableHead>
              <TableHead className="w-[150px]">ประเภท</TableHead>
              <TableHead className="w-[130px]">จังหวัด</TableHead>
              <TableHead className="w-[140px]">เบอร์โทรศัพท์</TableHead>
              <TableHead className="text-right w-[80px]">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Building2 className="h-7 w-7 text-muted-foreground/50" />
                    <span>ไม่พบข้อมูลหน่วยงานที่ตรงกับเงื่อนไขการค้นหา</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((dept) => (
                <TableRow key={dept.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    {dept.costCenterCode || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{dept.fullName}</span>
                      {dept.shortName && (
                        <span className="text-xs text-muted-foreground">
                          {dept.shortName}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {dept.type === "central"
                        ? "ส่วนกลาง"
                        : dept.type === "regional"
                          ? "ส่วนภูมิภาค"
                          : dept.type === "regional_central"
                            ? "ส่วนกลางในภูมิภาค"
                            : "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>{dept.province || "-"}</TableCell>
                  <TableCell>{dept.phone || "-"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" className="h-8 w-8 p-0" />
                        }
                      >
                        <span className="sr-only">เปิดเมนู</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>การจัดการ</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setEditingDept(dept)}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" /> แก้ไขข้อมูล
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setSelectedDeptForUsers(dept)}
                            className="cursor-pointer text-primary focus:text-primary"
                          >
                            <Users className="mr-2 h-4 w-4" /> จัดการบัญชีผู้ใช้งาน
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setSelectedDeptForServices(dept)}
                            className="cursor-pointer text-blue-600 focus:text-blue-600"
                          >
                            <Receipt className="mr-2 h-4 w-4" /> จัดการหมายเลขผู้ใช้
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => handleDelete(dept.id)}
                          >
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
      </div>

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
          departments={initialData}
          users={users.filter(
            (u) => u.departmentId === selectedDeptForUsers.id,
          )}
          open={!!selectedDeptForUsers}
          onOpenChange={(open) => {
            if (!open) setSelectedDeptForUsers(null);
          }}
        />
      )}

      {selectedDeptForServices && (
        <DepartmentServicesSheet
          department={selectedDeptForServices}
          services={services.filter(
            (s) => s.departmentId === selectedDeptForServices.id,
          )}
          open={!!selectedDeptForServices}
          onOpenChange={(open) => {
            if (!open) setSelectedDeptForServices(null);
          }}
        />
      )}
    </div>
  );
}

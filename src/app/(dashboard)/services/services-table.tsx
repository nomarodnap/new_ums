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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Trash2,
  Zap,
  Droplet,
  Phone,
  Wifi,
  Mail,
  Edit,
  Radio,
} from "lucide-react";
import { deleteDepartmentService } from "@/server/actions/department-services";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ServiceFormSheet } from "./service-form-sheet";

type Service = {
  id: string;
  departmentId: string;
  departmentName: string | null;
  utilityType: string;
  provider: string;
  serviceNumber: string;
  locationType: string | null;
  phoneOwnerName: string | null;
  phoneOwnerPosition: string | null;
  phoneReimbursementLimit: number | null;
};

type Department = {
  id: string;
  fullName: string;
  shortName: string | null;
};

export function ServicesTable({
  services,
  departments,
  userRole,
  userDepartmentId,
}: {
  services: Service[];
  departments: Department[];
  userRole: string;
  userDepartmentId: string | null;
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [utilityFilter, setUtilityFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);

  // Extract unique utility types from actual data
  const availableUtilityTypes = Array.from(
    new Set(services.map((s) => s.utilityType).filter(Boolean)),
  );

  const filteredServices = services.filter((s) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === "" ||
      (s.departmentName || "").toLowerCase().includes(searchLower) ||
      s.serviceNumber.toLowerCase().includes(searchLower) ||
      s.provider.toLowerCase().includes(searchLower) ||
      (s.phoneOwnerName || "").toLowerCase().includes(searchLower) ||
      (s.phoneOwnerPosition || "").toLowerCase().includes(searchLower) ||
      (s.locationType || "").toLowerCase().includes(searchLower);

    const matchesUtility =
      utilityFilter === "all" || s.utilityType === utilityFilter;

    return matchesSearch && matchesUtility;
  });

  const getUtilityIcon = (type: string) => {
    switch (type) {
      case "ค่าไฟฟ้า":
        return <Zap className="h-4 w-4 text-amber-500" />;
      case "ค่าน้ำประปา":
      case "ค่าประปา&น้ำบาดาล":
        return <Droplet className="h-4 w-4 text-blue-500" />;
      case "ค่าโทรศัพท์":
        return <Phone className="h-4 w-4 text-green-500" />;
      case "ค่าอินเทอร์เน็ต":
      case "ค่าสื่อสาร&โทรคมนาคม":
        return <Wifi className="h-4 w-4 text-purple-500" />;
      case "ค่าไปรษณีย์":
      case "ค่าบริการไปรษณีย์":
        return <Mail className="h-4 w-4 text-red-500" />;
      default:
        return <Radio className="h-4 w-4 text-primary" />;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบรายการนี้?")) return;

    setIsDeleting(id);
    const result = await deleteDepartmentService(id);
    if (result.success) {
      toast.success("ลบข้อมูลสำเร็จ");
      router.refresh();
    } else {
      toast.error(result.error || "เกิดข้อผิดพลาดในการลบข้อมูล");
    }
    setIsDeleting(null);
  };

  return (
    <div className="space-y-4">
      {/* Search and Dropdown Filter */}
      <div className="p-4 rounded-2xl bg-card/85 dark:bg-card/70 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาหน่วยงาน, รหัสเครื่องวัด, ชื่อเจ้าของ..."
              className="pl-9 h-9.5 rounded-xl bg-background/60 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-[190px]">
            <Select
              value={utilityFilter}
              onValueChange={(val) => val && setUtilityFilter(val)}
            >
              <SelectTrigger className="h-9.5 rounded-xl text-xs">
                <SelectValue placeholder="ประเภทสาธารณูปโภค">
                  {utilityFilter === "all"
                    ? "ทุกประเภทสาธารณูปโภค"
                    : utilityFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภทสาธารณูปโภค</SelectItem>
                {availableUtilityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs text-muted-foreground">
            พบ {filteredServices.length} จาก {services.length} รายการ
          </span>
          <Button
            onClick={() => {
              setServiceToEdit(null);
              setIsFormOpen(true);
            }}
            className="shrink-0 gap-1.5 shadow-xs"
          >
            <Plus className="size-4" /> เพิ่มรายการใหม่
          </Button>
        </div>
      </div>

      <div className="border border-black/[0.06] dark:border-white/[0.08] rounded-2xl bg-card/90 dark:bg-card/70 backdrop-blur-xl shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>หน่วยงาน</TableHead>
              <TableHead>ประเภท / ผู้ให้บริการ</TableHead>
              <TableHead>รหัสเครื่องวัด / เบอร์โทร</TableHead>
              <TableHead>สถานที่ / ผู้ใช้งาน</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-muted-foreground text-sm"
                >
                  ไม่พบข้อมูลที่ตรงกับเงื่อนไข
                </TableCell>
              </TableRow>
            ) : (
              filteredServices.map((service) => (
                <TableRow key={service.id} className="group">
                  <TableCell className="font-medium text-foreground text-xs sm:text-sm">
                    {service.departmentName || "ไม่ทราบหน่วยงาน"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/90">
                        {getUtilityIcon(service.utilityType)}
                        <span>{service.utilityType}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {service.provider}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold text-foreground/90 bg-muted/60 px-2 py-0.5 rounded-md border border-black/[0.04] dark:border-white/[0.06]">
                      {service.serviceNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5 text-xs">
                      {service.locationType && (
                        <span className="text-muted-foreground">
                          {service.locationType}
                        </span>
                      )}
                      {service.phoneOwnerName && (
                        <span className="font-medium text-foreground">
                          {service.phoneOwnerName}
                          {service.phoneOwnerPosition && (
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              ({service.phoneOwnerPosition})
                            </span>
                          )}
                        </span>
                      )}
                      {service.phoneReimbursementLimit && (
                        <span className="text-[11px] text-primary">
                          วงเงินเบิก: ฿
                          {service.phoneReimbursementLimit.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setServiceToEdit(service);
                          setIsFormOpen(true);
                        }}
                        className="size-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <Edit className="size-3.5 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isDeleting === service.id}
                        onClick={() => handleDelete(service.id)}
                        className="size-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>

                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ServiceFormSheet
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setTimeout(() => setServiceToEdit(null), 300);
        }}
        departments={departments}
        userRole={userRole}
        userDepartmentId={userDepartmentId}
        serviceToEdit={serviceToEdit}
      />
    </div>
  );
}

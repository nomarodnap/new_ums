"use client";

import { useState, useTransition } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  Coins,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react";
import { BudgetCodeDialog, BudgetCodeItem } from "./budget-code-dialog";
import {
  deleteBudgetCode,
  toggleBudgetCodeStatus,
} from "@/server/actions/budget-codes";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function BudgetCodesTable({
  initialData,
}: {
  initialData: BudgetCodeItem[];
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetCodeItem | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BudgetCodeItem | null>(null);

  const [isPending, startTransition] = useTransition();

  // Extract unique fiscal years
  const availableYears = Array.from(
    new Set(initialData.map((d) => d.fiscalYear)),
  ).sort((a, b) => b - a);

  // Filtered data
  const filteredData = initialData.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesYear =
      yearFilter === "all" || String(item.fiscalYear) === yearFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? item.isActive : !item.isActive);

    return matchesSearch && matchesYear && matchesStatus;
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: BudgetCodeItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleOpenDelete = (item: BudgetCodeItem) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    startTransition(async () => {
      const res = await deleteBudgetCode(itemToDelete.id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    });
  };

  const handleToggleStatus = (item: BudgetCodeItem) => {
    startTransition(async () => {
      const res = await toggleBudgetCodeStatus(item.id, !item.isActive);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Action bar and filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหารหัส หรือคำอธิบาย..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="w-[160px]">
            <Select
              value={yearFilter}
              onValueChange={(val) => val && setYearFilter(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="ปีงบประมาณ">
                  {yearFilter === "all"
                    ? "ทุกปีงบประมาณ"
                    : `ปี พ.ศ. ${yearFilter}`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกปีงบประมาณ</SelectItem>
                {availableYears.map((yr) => (
                  <SelectItem key={yr} value={String(yr)}>
                    ปี พ.ศ. {yr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[140px]">
            <Select
              value={statusFilter}
              onValueChange={(val) => val && setStatusFilter(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="สถานะ">
                  {statusFilter === "all"
                    ? "ทุกสถานะ"
                    : statusFilter === "active"
                      ? "เปิดใช้งาน"
                      : "ปิดใช้งาน"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="active">เปิดใช้งาน</SelectItem>
                <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleOpenCreate} className="shrink-0">
          <PlusCircle className="mr-2 h-4 w-4" />
          เพิ่มรหัสงบประมาณ
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[120px]">ปีงบประมาณ</TableHead>
              <TableHead className="w-[220px]">รหัสงบประมาณ</TableHead>
              <TableHead>คำอธิบาย / หมายเหตุ</TableHead>
              <TableHead className="w-[130px] text-center">สถานะ</TableHead>
              <TableHead className="w-[120px] text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-36 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Coins className="h-8 w-8 text-muted-foreground/50" />
                    <span>ไม่พบข้อมูลรหัสงบประมาณ</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Badge variant="outline" className="font-semibold text-xs">
                      พ.ศ. {item.fiscalYear}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm font-semibold text-primary">
                    {item.code}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.description || "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      disabled={isPending}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      title="คลิกเพื่อเปลี่ยนสถานะ"
                    >
                      {item.isActive ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 gap-1 hover:bg-emerald-200"
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          เปิดใช้งาน
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-muted text-muted-foreground gap-1 hover:bg-muted/80"
                        >
                          <XCircle className="h-3 w-3" />
                          ปิดใช้งาน
                        </Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(item)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="แก้ไข"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDelete(item)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="ลบ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog for Create/Edit */}
      <BudgetCodeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        budgetCodeToEdit={editingItem}
      />

      {/* Alert Dialog for Delete confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบรหัสงบประมาณ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบรหัสงบประมาณ{" "}
              <strong className="text-foreground">{itemToDelete?.code}</strong>{" "}
              ประจำปีงบประมาณ พ.ศ. {itemToDelete?.fiscalYear}{" "}
              การดำเนินการนี้ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "กำลังลบ..." : "ยืนยันลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

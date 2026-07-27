"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Ban, CheckCircle, Plus } from "lucide-react";
import { updateUserAdmin } from "@/server/actions/users";
import { UserFormSheet } from "./user-form-sheet";
import { CreateUserSheet } from "./create-user-sheet";

type UserData = {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean | null;
  role: string | null;
  banned: boolean | null;
  departmentId: string | null;
  departmentName: string | null;
  phone: string | null;
};

type DepartmentData = {
  id: string;
  fullName: string;
};

export function DepartmentUsersSheet({ 
  department, 
  users, 
  open, 
  onOpenChange 
}: { 
  department: DepartmentData, 
  users: UserData[], 
  open: boolean, 
  onOpenChange: (open: boolean) => void 
}) {
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);

  const toggleBan = async (user: UserData) => {
    if (confirm(`คุณต้องการ ${user.banned ? 'ปลดระงับ' : 'ระงับ'} บัญชี ${user.name} หรือไม่?`)) {
      const res = await updateUserAdmin(user.id, { banned: !user.banned });
      if (res.error) alert(res.error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-2xl" side="right">
        <SheetHeader className="mb-6 flex flex-row items-center justify-between">
          <div>
            <SheetTitle>จัดการบัญชีผู้ใช้งาน</SheetTitle>
            <SheetDescription>
              บัญชีผู้ใช้งานที่สังกัด {department.fullName}
            </SheetDescription>
          </div>
          <Button onClick={() => setCreatingUser(true)}>
            <Plus className="mr-2 h-4 w-4" /> เพิ่มผู้ใช้งาน
          </Button>
        </SheetHeader>
        
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ผู้ใช้งาน</TableHead>
                <TableHead>สิทธิ์ (Role)</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">ไม่พบบัญชีผู้ใช้งานในหน่วยงานนี้</TableCell>
                </TableRow>
              ) : users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                        <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {user.role || "user"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge 
                        variant={!user.banned ? "default" : "secondary"}
                        className={!user.banned ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {!user.banned ? "ใช้งานปกติ" : "ถูกระงับ"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">เปิดเมนู</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>การจัดการ</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setEditingUser(user)} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" /> แก้ไขข้อมูล/สิทธิ์
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className={`cursor-pointer ${!user.banned ? "text-destructive focus:text-destructive focus:bg-destructive/10" : "text-green-600 focus:text-green-600 focus:bg-green-600/10"}`}
                            onClick={() => toggleBan(user)}
                          >
                            {!user.banned ? <><Ban className="mr-2 h-4 w-4" /> ระงับการใช้งาน</> : <><CheckCircle className="mr-2 h-4 w-4" /> เปิดใช้งาน</>}
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {editingUser && (
          <UserFormSheet 
            user={editingUser} 
            department={department} 
            open={!!editingUser}
            onOpenChange={(open) => { if (!open) setEditingUser(null); }}
          />
        )}

        {creatingUser && (
          <CreateUserSheet
            department={department}
            open={creatingUser}
            onOpenChange={setCreatingUser}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

import { requireRole } from "@/server/auth";
import { db } from "@/server/db";
import { budgetCodes } from "@/server/db/schema";
import { desc } from "drizzle-orm";
import { BudgetCodesTable } from "./budget-codes-table";
import { Settings, Coins } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function SettingsPage() {
  await requireRole([
    "admin",
    "strategy_finance",
    "central_staff",
    "regional_staff",
    "auditor",
  ]);

  const allBudgetCodes = await db
    .select()
    .from(budgetCodes)
    .orderBy(desc(budgetCodes.fiscalYear), desc(budgetCodes.createdAt));

  return (
    <div className="flex-1 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="h-7 w-7 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight">ตั้งค่าระบบ</h2>
        </div>
        <p className="text-muted-foreground mt-1">
          จัดการข้อมูลการตั้งค่าพื้นฐานของระบบและรหัสงบประมาณประจำปี
        </p>
      </div>

      <Tabs defaultValue="budget-codes" className="w-full">
        <TabsList className="grid w-full sm:w-[320px] grid-cols-1">
          <TabsTrigger value="budget-codes" className="gap-2">
            <Coins className="h-4 w-4" />
            <span>รหัสงบประมาณ</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budget-codes" className="mt-6 space-y-4">
          <BudgetCodesTable initialData={allBudgetCodes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

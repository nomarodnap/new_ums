"use server";

import { db } from "@/server/db";
import { budgetCodes } from "@/server/db/schema";
import { requireRole } from "@/server/auth";
import { budgetCodeSchema } from "@/lib/validations/budget-codes";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getBudgetCodes(fiscalYear?: number) {
  const query = db.select().from(budgetCodes);
  if (fiscalYear) {
    return await query
      .where(eq(budgetCodes.fiscalYear, fiscalYear))
      .orderBy(desc(budgetCodes.createdAt));
  }
  return await query.orderBy(
    desc(budgetCodes.fiscalYear),
    desc(budgetCodes.createdAt),
  );
}

export async function createBudgetCode(
  prevState: unknown,
  formData: FormData,
): Promise<{
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  try {
    await requireRole(["admin", "strategy_finance", "central_staff"]);

    const rawData = {
      code: formData.get("code"),
      name: formData.get("name"),
      fiscalYear: formData.get("fiscalYear"),
      description: formData.get("description") || undefined,
      isActive:
        formData.get("isActive") === "on" ||
        formData.get("isActive") === "true",
    };

    const parsed = budgetCodeSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors,
        message: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
      };
    }

    await db.insert(budgetCodes).values({
      id: crypto.randomUUID(),
      code: parsed.data.code.trim(),
      name: (parsed.data.name || "").trim(),
      fiscalYear: parsed.data.fiscalYear,
      description: parsed.data.description?.trim() || null,
      isActive: parsed.data.isActive ?? true,
    });

    revalidatePath("/settings");
    revalidatePath("/settings/budget-codes");
    revalidatePath("/bills/new");
    return {
      success: true,
      message: "บันทึกรหัสงบประมาณเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Error creating budget code:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึก",
    };
  }
}

export async function updateBudgetCode(
  id: string,
  prevState: unknown,
  formData: FormData,
): Promise<{
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  try {
    await requireRole(["admin", "strategy_finance", "central_staff"]);

    const rawData = {
      code: formData.get("code"),
      name: formData.get("name"),
      fiscalYear: formData.get("fiscalYear"),
      description: formData.get("description") || undefined,
      isActive:
        formData.get("isActive") === "on" ||
        formData.get("isActive") === "true",
    };

    const parsed = budgetCodeSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors,
        message: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
      };
    }

    await db
      .update(budgetCodes)
      .set({
        code: parsed.data.code.trim(),
        name: (parsed.data.name || "").trim(),
        fiscalYear: parsed.data.fiscalYear,
        description: parsed.data.description?.trim() || null,
        isActive: parsed.data.isActive ?? true,
        updatedAt: new Date(),
      })
      .where(eq(budgetCodes.id, id));

    revalidatePath("/settings");
    revalidatePath("/settings/budget-codes");
    revalidatePath("/bills/new");
    return {
      success: true,
      message: "แก้ไขรหัสงบประมาณเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Error updating budget code:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการแก้ไข",
    };
  }
}

export async function deleteBudgetCode(id: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await requireRole(["admin", "strategy_finance", "central_staff"]);

    await db.delete(budgetCodes).where(eq(budgetCodes.id, id));

    revalidatePath("/settings");
    revalidatePath("/settings/budget-codes");
    revalidatePath("/bills/new");
    return {
      success: true,
      message: "ลบรหัสงบประมาณเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Error deleting budget code:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบ",
    };
  }
}

export async function toggleBudgetCodeStatus(
  id: string,
  isActive: boolean,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await requireRole(["admin", "strategy_finance", "central_staff"]);

    await db
      .update(budgetCodes)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(budgetCodes.id, id));

    revalidatePath("/settings");
    revalidatePath("/settings/budget-codes");
    revalidatePath("/bills/new");
    return {
      success: true,
      message: `เปลี่ยนสถานะเป็น${isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}เรียบร้อยแล้ว`,
    };
  } catch (error) {
    console.error("Error toggling budget code status:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ",
    };
  }
}

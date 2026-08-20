"use server";

import { db } from "@/server/db";
import { budgets } from "@/server/db/schema";
import { requireRole } from "@/server/auth";
import { budgetSchema } from "@/lib/validations/budgets";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createBudget(formData: FormData) {
  await requireRole(["admin", "strategy_finance"]);

  const parsed = budgetSchema.safeParse({
    budgetCode: formData.get("budgetCode"),
    name: formData.get("name"),
    fundSource: formData.get("fundSource") || null,
    allocatedAmount: formData.get("allocatedAmount"),
    transferredAmount: formData.get("transferredAmount"),
    departmentId: formData.get("departmentId"),
    fiscalYear: formData.get("fiscalYear"),
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await db.insert(budgets).values({
      id: crypto.randomUUID(),
      budgetCode: parsed.data.budgetCode,
      name: parsed.data.name,
      fundSource: parsed.data.fundSource,
      allocatedAmount: parsed.data.allocatedAmount.toString(),
      transferredAmount: parsed.data.transferredAmount.toString(),
      departmentId: parsed.data.departmentId,
      fiscalYear: parsed.data.fiscalYear,
    });

    revalidatePath("/budgets");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: "Failed to create budget" };
  }
}

export async function updateBudget(id: string, formData: FormData) {
  await requireRole(["admin", "strategy_finance"]);

  const parsed = budgetSchema.safeParse({
    budgetCode: formData.get("budgetCode"),
    name: formData.get("name"),
    fundSource: formData.get("fundSource") || null,
    allocatedAmount: formData.get("allocatedAmount"),
    transferredAmount: formData.get("transferredAmount"),
    departmentId: formData.get("departmentId"),
    fiscalYear: formData.get("fiscalYear"),
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await db
      .update(budgets)
      .set({
        budgetCode: parsed.data.budgetCode,
        name: parsed.data.name,
        fundSource: parsed.data.fundSource,
        allocatedAmount: parsed.data.allocatedAmount.toString(),
        transferredAmount: parsed.data.transferredAmount.toString(),
        departmentId: parsed.data.departmentId,
        fiscalYear: parsed.data.fiscalYear,
        updatedAt: new Date(),
      })
      .where(eq(budgets.id, id));

    revalidatePath("/budgets");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: "Failed to update budget" };
  }
}

export async function deleteBudget(id: string) {
  await requireRole(["admin", "strategy_finance"]);

  try {
    await db.delete(budgets).where(eq(budgets.id, id));
    revalidatePath("/budgets");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: "Failed to delete budget" };
  }
}

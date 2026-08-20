"use server";

import { z } from "zod";
import { db } from "@/server/db";
import { departments } from "@/server/db/schema";
import { requireRole } from "@/server/auth";
import { departmentSchema } from "@/lib/validations/departments";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createDepartment(formData: FormData) {
  // Only admin and central_staff can manage departments
  await requireRole(["admin", "central_staff", "regional_staff"]);

  const parsed = departmentSchema.safeParse({
    costCenterCode: formData.get("costCenterCode") || null,
    disbursingUnit: formData.get("disbursingUnit") || null,
    depositUnit: formData.get("depositUnit") || null,
    fullName: formData.get("fullName"),
    shortName: formData.get("shortName") || null,
    division: formData.get("division") || null,
    location: formData.get("location") || null,
    province: formData.get("province") || null,
    responsiblePerson: formData.get("responsiblePerson") || null,
    phone: formData.get("phone") || null,
    responsiblePhone: formData.get("responsiblePhone") || null,
    email: formData.get("email") || null,
    type: formData.get("type") || null,
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await db.insert(departments).values({
      id: crypto.randomUUID(),
      ...parsed.data,
    });

    revalidatePath("/departments");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: "Failed to create department" };
  }
}

export async function updateDepartment(id: string, formData: FormData) {
  await requireRole(["admin", "central_staff", "regional_staff"]);

  const parsed = departmentSchema.safeParse({
    costCenterCode: formData.get("costCenterCode") || null,
    disbursingUnit: formData.get("disbursingUnit") || null,
    depositUnit: formData.get("depositUnit") || null,
    fullName: formData.get("fullName"),
    shortName: formData.get("shortName") || null,
    division: formData.get("division") || null,
    location: formData.get("location") || null,
    province: formData.get("province") || null,
    responsiblePerson: formData.get("responsiblePerson") || null,
    phone: formData.get("phone") || null,
    responsiblePhone: formData.get("responsiblePhone") || null,
    email: formData.get("email") || null,
    type: formData.get("type") || null,
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await db
      .update(departments)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(departments.id, id));

    revalidatePath("/departments");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: "Failed to update department" };
  }
}

export async function deleteDepartment(id: string) {
  await requireRole(["admin"]); // Only admin should delete

  try {
    await db.delete(departments).where(eq(departments.id, id));
    revalidatePath("/departments");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: "Failed to delete department" };
  }
}

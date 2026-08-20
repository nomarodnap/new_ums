"use server";

import { z } from "zod";
import { db } from "@/server/db";
import { departmentServices } from "@/server/db/schema";
import { requireRole } from "@/server/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getDepartmentServices(departmentId: string) {
  const session = await requireRole([
    "admin",
    "central_staff",
    "regional_staff",
    "user",
  ]);

  const services = await db
    .select()
    .from(departmentServices)
    .where(eq(departmentServices.departmentId, departmentId));
  return services;
}

const serviceSchema = z
  .object({
    departmentId: z.string().min(1, "กรุณาระบุหน่วยงาน"),
    utilityType: z.string().min(1, "กรุณาระบุประเภทสาธารณูปโภค"),
    provider: z.string().min(1, "กรุณาระบุผู้ให้บริการ"),
    serviceNumber: z.string().min(1, "กรุณาระบุหมายเลขผู้ใช้/รหัสเครื่องวัด"),
    locationType: z.string().optional(),
    phoneOwnerName: z.string().optional(),
    phoneOwnerPosition: z.string().optional(),
    phoneReimbursementLimit: z.coerce.number().optional(),
    phoneType: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.utilityType === "ค่าโทรศัพท์" && data.phoneType === "mobile") {
      if (!data.phoneOwnerName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาระบุชื่อ-สกุลเจ้าของเบอร์",
          path: ["phoneOwnerName"],
        });
      }
      if (!data.phoneOwnerPosition) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาระบุตำแหน่งเจ้าของเบอร์",
          path: ["phoneOwnerPosition"],
        });
      }
    }
  });

export async function addDepartmentService(prevState: any, formData: FormData) {
  try {
    const session = await requireRole([
      "admin",
      "central_staff",
      "regional_staff",
      "user",
    ]);

    const parsed = serviceSchema.safeParse({
      departmentId: formData.get("departmentId"),
      utilityType: formData.get("utilityType"),
      provider: formData.get("provider"),
      serviceNumber: formData.get("serviceNumber"),
      locationType: formData.get("locationType") || undefined,
      phoneOwnerName: formData.get("phoneOwnerName") || undefined,
      phoneOwnerPosition: formData.get("phoneOwnerPosition") || undefined,
      phoneReimbursementLimit:
        formData.get("phoneReimbursementLimit") || undefined,
      phoneType: formData.get("phoneType") || undefined,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().fieldErrors };
    }

    if (
      session.user.role === "user" &&
      parsed.data.departmentId !== session.user.departmentId
    ) {
      return {
        success: false,
        error: "ท่านสามารถจัดการได้เฉพาะหมายเลขผู้ใช้ของหน่วยงานตนเองเท่านั้น",
      };
    }

    let limit = parsed.data.phoneReimbursementLimit;
    if (
      parsed.data.utilityType === "ค่าโทรศัพท์" &&
      parsed.data.phoneType === "mobile"
    ) {
      if (session.user.role === "user") {
        limit = 1000;
      } else if (!limit) {
        limit = 1000;
      }
    } else {
      limit = undefined;
    }

    await db.insert(departmentServices).values({
      id: crypto.randomUUID(),
      departmentId: parsed.data.departmentId,
      utilityType: parsed.data.utilityType,
      provider: parsed.data.provider,
      serviceNumber: parsed.data.serviceNumber,
      locationType: parsed.data.locationType,
      phoneOwnerName: parsed.data.phoneOwnerName,
      phoneOwnerPosition: parsed.data.phoneOwnerPosition,
      phoneReimbursementLimit: limit,
    });

    revalidatePath("/departments");
    revalidatePath("/bills/new");
    revalidatePath("/services");
    return { success: true };
  } catch (error) {
    return { success: false, error: "เกิดข้อผิดพลาด หรือท่านไม่มีสิทธิ์ในการทำรายการนี้" };
  }
}

export async function deleteDepartmentService(id: string) {
  try {
    const session = await requireRole([
      "admin",
      "central_staff",
      "regional_staff",
      "user",
    ]);

    if (session.user.role === "user") {
      const existingService = await db
        .select()
        .from(departmentServices)
        .where(eq(departmentServices.id, id))
        .limit(1);
      if (
        existingService.length === 0 ||
        existingService[0].departmentId !== session.user.departmentId
      ) {
        return {
          success: false,
          error: "ท่านสามารถจัดการได้เฉพาะหมายเลขผู้ใช้ของหน่วยงานตนเองเท่านั้น",
        };
      }
    }
    await db.delete(departmentServices).where(eq(departmentServices.id, id));

    revalidatePath("/departments");
    revalidatePath("/bills/new");
    revalidatePath("/services");
    return { success: true };
  } catch (error) {
    return { success: false, error: "เกิดข้อผิดพลาด" };
  }
}

export async function updateDepartmentService(
  id: string,
  prevState: any,
  formData: FormData,
) {
  try {
    const session = await requireRole([
      "admin",
      "central_staff",
      "regional_staff",
      "user",
    ]);

    const parsed = serviceSchema.safeParse({
      departmentId: formData.get("departmentId"),
      utilityType: formData.get("utilityType"),
      provider: formData.get("provider"),
      serviceNumber: formData.get("serviceNumber"),
      locationType: formData.get("locationType") || undefined,
      phoneOwnerName: formData.get("phoneOwnerName") || undefined,
      phoneOwnerPosition: formData.get("phoneOwnerPosition") || undefined,
      phoneReimbursementLimit:
        formData.get("phoneReimbursementLimit") || undefined,
      phoneType: formData.get("phoneType") || undefined,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().fieldErrors };
    }

    if (
      session.user.role === "user" &&
      parsed.data.departmentId !== session.user.departmentId
    ) {
      return {
        success: false,
        error: "ท่านสามารถจัดการได้เฉพาะหมายเลขผู้ใช้ของหน่วยงานตนเองเท่านั้น",
      };
    }

    let limit = parsed.data.phoneReimbursementLimit;
    if (
      parsed.data.utilityType === "ค่าโทรศัพท์" &&
      parsed.data.phoneType === "mobile" &&
      !limit
    ) {
      limit = 1000;
    }

    const updatePayload: any = {
      departmentId: parsed.data.departmentId,
      utilityType: parsed.data.utilityType,
      provider: parsed.data.provider,
      serviceNumber: parsed.data.serviceNumber,
      locationType: parsed.data.locationType,
      phoneOwnerName: parsed.data.phoneOwnerName,
      phoneOwnerPosition: parsed.data.phoneOwnerPosition,
      updatedAt: new Date(),
    };

    if (session.user.role !== "user") {
      updatePayload.phoneReimbursementLimit = limit;
    }

    await db
      .update(departmentServices)
      .set(updatePayload)
      .where(eq(departmentServices.id, id));

    revalidatePath("/departments");
    revalidatePath("/bills/new");
    revalidatePath("/services");
    return { success: true };
  } catch (error) {
    return { success: false, error: "เกิดข้อผิดพลาด หรือท่านไม่มีสิทธิ์ในการทำรายการนี้" };
  }
}

"use server";

import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { requireRole, auth } from "@/server/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateUserAdmin(
  userId: string, 
  data: { role?: string; departmentId?: string; phone?: string; banned?: boolean }
) {
  await requireRole(["admin"]);

  try {
    const updateData: any = { updatedAt: new Date() };
    if (data.role !== undefined) updateData.role = data.role;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId === "" ? null : data.departmentId;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.banned !== undefined) updateData.banned = data.banned;

    await db.update(user)
      .set(updateData)
      .where(eq(user.id, userId));
      
    revalidatePath("/users");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: "Failed to update user" };
  }
}

export async function createUserAdmin(
  data: { name: string; email: string; password?: string; role?: string; departmentId: string; phone?: string }
) {
  const session = await requireRole(["admin"]);

  try {
    const password = crypto.randomUUID() + "A1!x"; // Generate secure random password

    // Use Better Auth admin plugin to create user
    const res = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: password,
        name: data.name,
      },
      asResponse: true,
    });

    if (!res.ok) {
        const error = await res.json();
        return { success: false as const, error: error.message || "Failed to create user" };
    }

    // Now get the created user (since signUpEmail doesn't return the user directly, we query it)
    const newUser = await db.query.user.findFirst({
        where: eq(user.email, data.email)
    });

    if (newUser) {
        await db.update(user).set({
            role: data.role || "user",
            departmentId: data.departmentId,
            phone: data.phone || null,
            emailVerified: true,
        }).where(eq(user.id, newUser.id));

        // We no longer trigger the password setup email here.
        // Users can set their password via the "Forgot Password" flow on their first login.
    }

    revalidatePath("/departments");
    return { success: true as const };
  } catch (error: any) {
    console.error(error);
    return { success: false as const, error: error.message || "Failed to create user" };
  }
}

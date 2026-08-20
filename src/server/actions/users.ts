"use server";

import { db } from "@/server/db";
import { user, account } from "@/server/db/schema";
import { requireRole, auth } from "@/server/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateUserAdmin(
  userId: string,
  data: {
    role?: string;
    departmentId?: string;
    phone?: string;
    banned?: boolean;
  },
) {
  await requireRole(["admin"]);

  try {
    const updateData: any = { updatedAt: new Date() };
    if (data.role !== undefined) updateData.role = data.role;
    if (data.departmentId !== undefined)
      updateData.departmentId =
        data.departmentId === "" ? null : data.departmentId;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.banned !== undefined) updateData.banned = data.banned;

    await db.update(user).set(updateData).where(eq(user.id, userId));

    revalidatePath("/departments");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: "Failed to update user" };
  }
}

export async function createUserAdmin(data: {
  name: string;
  email: string;
  password?: string;
  role?: string;
  departmentId: string;
  phone?: string;
}) {
  await requireRole(["admin"]);

  try {
    const tempPassword = crypto.randomUUID() + "A1!x"; // Temporary password to satisfy signup API

    // Use Better Auth admin plugin to create user
    const res = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: tempPassword,
        name: data.name,
      },
      asResponse: true,
    });

    if (!res.ok) {
      const error = await res.json();
      return {
        success: false as const,
        error: error.message || "Failed to create user",
      };
    }

    // Now get the created user (since signUpEmail doesn't return the user directly, we query it)
    const newUser = await db.query.user.findFirst({
      where: eq(user.email, data.email),
    });

    if (newUser) {
      await db
        .update(user)
        .set({
          role: data.role || "user",
          departmentId: data.departmentId,
          phone: data.phone || null,
          emailVerified: false,
        })
        .where(eq(user.id, newUser.id));

      // If no explicit password was set by admin, reset account.password to null
      if (!data.password) {
        await db
          .update(account)
          .set({ password: null })
          .where(
            and(
              eq(account.userId, newUser.id),
              eq(account.providerId, "credential"),
            ),
          );

        // Send password setup email to user
        try {
          await auth.api.requestPasswordReset({
            body: {
              email: data.email,
              redirectTo: "/set-password",
            },
          });
        } catch (mailErr) {
          console.error("Failed to send initial password email:", mailErr);
        }
      }
    }

    revalidatePath("/departments");
    return { success: true as const };
  } catch (error: any) {
    console.error(error);
    return {
      success: false as const,
      error: error.message || "Failed to create user",
    };
  }
}

export async function sendUserResetPassword(email: string) {
  await requireRole(["admin"]);

  try {
    const res = await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: "/set-password",
      },
    });

    return { success: true as const };
  } catch (error: any) {
    console.error("Failed to send reset password email:", error);
    return {
      success: false as const,
      error: error?.message || "Failed to send reset password email",
    };
  }
}

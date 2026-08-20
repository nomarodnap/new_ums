"use server";

import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function checkEmailExists(email: string) {
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  return !!existingUser;
}

import { db } from "../src/server/db";
import { user } from "../src/server/db/schema";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  const email = "admin@fisheries.go.th";
  const password = "password123";
  const name = "Admin User";

  console.log(`Seeding admin account: ${email}...`);

  try {
    // 1. Sign up the user via Better Auth API
    console.log("Creating user via Better Auth API...");
    const res = await fetch("http://127.0.0.1:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "origin": "http://localhost:3000",
        "host": "localhost:3000"
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      if (data.message?.includes("already exists")) {
        console.log("User already exists, proceeding to update role...");
      } else {
        throw new Error(`Failed to create user: ${JSON.stringify(data)}`);
      }
    } else {
      console.log("User created successfully!");
    }

    // 2. Set the user's role to 'admin' using Drizzle
    console.log("Updating role to 'admin' in the database...");
    await db.update(user)
      .set({ role: "admin" })
      .where(eq(user.email, email));

    console.log("✅ Admin user seeded successfully!");
    console.log("-----------------------------------------");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log("-----------------------------------------");
    process.exit(0);

  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
}

seedAdmin();

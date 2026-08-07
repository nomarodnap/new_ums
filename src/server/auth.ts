import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { admin } from "better-auth/plugins";
import { headers } from "next/headers";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    trustedOrigins: ["http://localhost:3000", "https://ums.fisheries.go.th"],
    trustHost: true,
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
            const html = `
                <div style="font-family: sans-serif; max-w-md; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
                    <h2 style="color: #333;">ยินดีต้อนรับสู่ระบบรายงานค่าสาธารณูปโภค</h2>
                    <p>สวัสดีคุณ ${user.name},</p>
                    <p>บัญชีผู้ใช้งานของคุณได้รับการสร้างแล้ว โปรดคลิกที่ปุ่มด้านล่างเพื่อตั้งรหัสผ่านสำหรับเข้าใช้งานระบบ</p>
                    <div style="margin: 30px 0;">
                        <a href="${url}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">ตั้งรหัสผ่าน</a>
                    </div>
                    <p style="font-size: 12px; color: #666;">ลิงก์นี้ใช้สำหรับการตั้งรหัสผ่านเพียงครั้งเดียวเท่านั้น</p>
                    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
                    <p style="font-size: 11px; color: #888; line-height: 1.5;">
                        <strong>หมายเหตุ:</strong> หากอีเมลฉบับนี้อยู่ในโฟลเดอร์จดหมายขยะ (Spam / Junk Mail) กรุณากดปุ่ม <strong>"ไม่ใช่จดหมายขยะ" (Not Spam)</strong> หรือเพิ่มอีเมลนี้ลงในรายชื่อผู้ติดต่อที่ปลอดภัย เพื่อไม่ให้พลาดการแจ้งเตือนสำคัญในครั้งถัดไป
                    </p>
                </div>
            `;
            const { sendEmail } = await import("@/lib/email");
            await sendEmail(user.email, "ตั้งรหัสผ่านเพื่อเข้าใช้งานระบบรายงานค่าสาธารณูปโภค", html);
        }
    },
    user: {
        additionalFields: {
            departmentId: {
                type: "string",
                required: false,
            },
            phone: {
                type: "string",
                required: false,
            }
        }
    },
    plugins: [
        admin()
    ]
});

import { redirect } from "next/navigation";

export type Role = "admin" | "auditor" | "strategy_finance" | "central_staff" | "regional_staff" | "user";

export async function requireRole(allowed: Role[]) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  const user = session.user as typeof session.user & { role: string };

  if (!allowed.includes(user.role as Role)) {
    redirect("/unauthorized");
  }

  return {
    session: session.session,
    user: {
      ...session.user,
      role: user.role as Role
    }
  };
}

"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await authClient.requestPasswordReset({
        email,
        redirectTo: "/set-password",
      });
      
      if (res.error) {
        setError(res.error.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดที่ไม่คาดคิด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            {success ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <Zap className="h-6 w-6 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {success ? "ตรวจสอบอีเมลของคุณ" : "ลืมรหัสผ่าน / ตั้งรหัสผ่าน"}
          </CardTitle>
          <CardDescription>
            {success 
              ? `เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านไปที่ ${email} เรียบร้อยแล้ว โปรดตรวจสอบกล่องจดหมายของคุณ`
              : "กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่ หรือใช้สำหรับตั้งรหัสผ่านครั้งแรก"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!success ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">อีเมล</label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@fisheries.go.th"
                  disabled={loading}
                />
              </div>
              {error && <div className="text-sm text-destructive">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading || !email}>
                {loading ? "กำลังส่งลิงก์..." : "ส่งลิงก์ตั้งรหัสผ่าน"}
              </Button>
              <div className="text-center mt-4">
                <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-2">
                  <ArrowLeft className="h-4 w-4" /> กลับไปหน้าเข้าสู่ระบบ
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3 mb-4">
                <p className="text-sm text-amber-800 text-center font-medium">
                  ⚠️ หากไม่พบอีเมลในกล่องจดหมายขาเข้า (Inbox) กรุณาตรวจสอบในโฟลเดอร์จดหมายขยะ (Spam / Junk Mail)
                  และแนะนำให้กดปุ่ม <strong>"ไม่ใช่จดหมายขยะ" (Not Spam)</strong> หรือเพิ่มลงในรายชื่อผู้ติดต่อที่ปลอดภัย เพื่อไม่ให้พลาดการแจ้งเตือนในครั้งถัดไป
                </p>
              </div>
              <Link href="/sign-in" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full">
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

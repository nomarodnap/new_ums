"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("ไม่พบ Token สำหรับการตั้งรหัสผ่าน");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (password.length < 8) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
      return;
    }

    setIsPending(true);
    
    // Using Better Auth's resetPassword client method
    const { data, error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token: token,
    });

    setIsPending(false);

    if (resetError) {
      setError(resetError.message || "เกิดข้อผิดพลาดในการตั้งรหัสผ่าน");
    } else {
      alert("ตั้งรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่");
      router.push("/sign-in");
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <p className="text-destructive">ไม่พบ Token ที่ใช้ในการตั้งรหัสผ่าน</p>
        <Button onClick={() => router.push("/sign-in")}>กลับไปหน้าเข้าสู่ระบบ</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-sm font-medium text-destructive">{error}</div>}
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">รหัสผ่านใหม่</label>
        <Input 
          id="password" 
          type="password" 
          required 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">ยืนยันรหัสผ่านใหม่</label>
        <Input 
          id="confirmPassword" 
          type="password" 
          required 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "กำลังบันทึก..." : "ตั้งรหัสผ่าน"}
      </Button>
    </form>
  );
}

export default function SetPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">ตั้งรหัสผ่านใหม่</CardTitle>
            <CardDescription>
              กรุณาตั้งรหัสผ่านสำหรับการเข้าใช้งานระบบ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-center text-sm text-muted-foreground">กำลังโหลด...</div>}>
              <SetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

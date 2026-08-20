"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await authClient.signIn.email({
        email,
        password,
      });
      if (res.error) {
        setError(res.error.message || "Failed to sign in");
        setLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg border-border/60">
        <CardHeader className="space-y-3 text-center pb-2">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 p-2.5 shadow-md ring-1 ring-slate-900/5 dark:ring-slate-100/10">
            <Image
              src="/logo.png"
              alt="ตราสัญลักษณ์กรมประมง"
              width={80}
              height={80}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            เข้าสู่ระบบ
          </CardTitle>
          <CardDescription className="text-sm">
            ระบบจัดการและรายงานค่าใช้จ่ายสาธารณูปโภค กรมประมง
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                อีเมล
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@fisheries.go.th"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  รหัสผ่าน
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline relative z-10"
                >
                  ลืมรหัสผ่าน / ตั้งรหัสผ่านครั้งแรก?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                "เข้าสู่ระบบ"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

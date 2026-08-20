import Image from "next/image";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground text-center p-4">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 p-2.5 shadow-md ring-1 ring-slate-900/5 dark:ring-slate-100/10">
        <Image
          src="/logo.png"
          alt="ตราสัญลักษณ์กรมประมง"
          width={80}
          height={80}
          className="h-full w-full object-contain"
          priority
        />
      </div>
      <div className="inline-flex items-center gap-2 text-destructive bg-destructive/10 px-3 py-1 rounded-full text-sm font-semibold mb-3">
        <ShieldAlert className="h-4 w-4" />
        403 - ไม่มีสิทธิ์เข้าถึง
      </div>
      <h1 className="text-2xl font-bold mb-2">คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้</h1>
      <p className="text-muted-foreground mb-8 text-sm max-w-md">
        กรุณาติดต่อผู้ดูแลระบบ กรมประมง
        หากคุณเชื่อว่านี่คือข้อผิดพลาดหรือต้องการขอสิทธิ์การใช้งานเพิ่มเติม
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors"
      >
        กลับสู่หน้าหลัก
      </Link>
    </div>
  );
}

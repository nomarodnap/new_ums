import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3">
      <div className="relative flex items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-slate-900 p-2 shadow-sm ring-1 ring-primary/20">
          <Image
            src="/logo.png"
            alt="ตราสัญลักษณ์กรมประมง"
            width={48}
            height={48}
            className="h-full w-full object-contain"
            priority
          />
        </div>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground mt-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <p className="text-sm font-medium">กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  );
}

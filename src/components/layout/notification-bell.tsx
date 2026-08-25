import { Bell } from "lucide-react";
import Link from "next/link";
import { getMyNotifications } from "@/server/actions/notifications";
import { Button } from "@/components/ui/button";

export async function NotificationBell({
  initialCount,
}: {
  initialCount?: number;
}) {
  let unreadCount = initialCount ?? 0;

  if (initialCount === undefined) {
    try {
      const notifications = await getMyNotifications();
      unreadCount = notifications.filter((n) => !n.isRead).length;
    } catch (error) {
      console.error("Failed to fetch notifications for bell");
    }
  }

  return (
    <Link href="/notifications">
      <Button
        variant="ghost"
        size="icon"
        className="relative size-9 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all text-muted-foreground hover:text-foreground"
        title="การแจ้งเตือนของหน่วยงาน"
      >
        <Bell className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  );
}


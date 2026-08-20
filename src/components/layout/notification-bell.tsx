import { Bell } from "lucide-react";
import Link from "next/link";
import { getMyNotifications } from "@/server/actions/notifications";
import { Button } from "@/components/ui/button";

export async function NotificationBell() {
  let unreadCount = 0;

  try {
    const notifications = await getMyNotifications();
    unreadCount = notifications.filter((n) => !n.isRead).length;
  } catch (error) {
    // Graceful fallback if auth fails or not available
    console.error("Failed to fetch notifications for bell");
  }

  return (
    <Link href="/notifications">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  );
}

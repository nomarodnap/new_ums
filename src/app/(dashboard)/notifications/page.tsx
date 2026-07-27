import { getMyNotifications } from "@/server/actions/notifications";
import { NotificationList } from "@/components/notifications/notification-list";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "การแจ้งเตือน | UMS",
  description: "ระบบรายงานค่าสาธารณูปโภค",
};

export default async function NotificationsPage() {
  const notifications = await getMyNotifications();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <NotificationList initialNotifications={notifications} />
    </div>
  );
}

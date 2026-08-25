import { getMyNotifications } from "@/server/actions/notifications";
import { NotificationList } from "@/components/notifications/notification-list";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "การแจ้งเตือนหน่วยงาน | UMS",
  description: "ระบบรายงานค่าสาธารณูปโภค",
};

export default async function NotificationsPage() {
  const notifications = await getMyNotifications();

  return (
    <div className="flex flex-col gap-6">
      <NotificationList
        initialNotifications={notifications}
        title="การแจ้งเตือนของหน่วยงาน"
        description="รายการแจ้งเตือนเฉพาะหน่วยงานที่ท่านสังกัดและประกาศสำคัญของระบบ"
        scope="my_dept"
        showDepartmentBadge={false}
      />
    </div>
  );
}

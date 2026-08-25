import { getAllSystemNotifications } from "@/server/actions/notifications";
import { NotificationList } from "@/components/notifications/notification-list";
import { requireRole } from "@/server/auth";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "การแจ้งเตือนทุกหน่วยงานในระบบ | UMS",
  description: "ระบบรายงานค่าสาธารณูปโภค",
};

export default async function AllNotificationsPage() {
  await requireRole(["admin", "auditor"]);
  const notifications = await getAllSystemNotifications();

  return (
    <div className="flex flex-col gap-6">
      <NotificationList
        initialNotifications={notifications}
        title="การแจ้งเตือนทุกหน่วยงานในระบบ"
        description="รายการแจ้งเตือนทั้งหมดจากทุกสำนัก/กอง/ศูนย์ทั่วประเทศ (สำหรับผู้ดูแลระบบ)"
        scope="all"
        showDepartmentBadge={true}
        showAcknowledgeButton={false}
      />
    </div>
  );
}

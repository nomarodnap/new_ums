"use client";

import { useTransition } from "react";
import { markAsRead, markAllAsRead } from "@/server/actions/notifications";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";

type Notification = {
  id: string;
  departmentId: string | null;
  targetRole: string | null;
  title: string;
  message: string;
  type: string;
  severity: string;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
  updatedAt: Date;
};

interface NotificationListProps {
  initialNotifications: Notification[];
}

export function NotificationList({
  initialNotifications,
}: NotificationListProps) {
  const [isPending, startTransition] = useTransition();

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      try {
        const result = await markAsRead(id);
        if (result.success) {
          toast.success("ทำเครื่องหมายว่าอ่านแล้ว");
        }
      } catch (error) {
        toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
    });
  };

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      try {
        const result = await markAllAsRead();
        if (result.success) {
          toast.success("ทำเครื่องหมายว่าอ่านแล้วทั้งหมด");
        }
      } catch (error) {
        toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "URGENT":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "WARNING":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "URGENT":
        return <Badge variant="destructive">ด่วน</Badge>;
      case "WARNING":
        return (
          <Badge className="bg-amber-500 text-white hover:bg-amber-600">
            เฝ้าระวัง
          </Badge>
        );
      default:
        return <Badge variant="secondary">ปกติ</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">การแจ้งเตือน</h2>
        {initialNotifications.some((n) => !n.isRead) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isPending}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            อ่านทั้งหมด
          </Button>
        )}
      </div>

      {initialNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">ไม่มีการแจ้งเตือน</h3>
            <p className="text-sm text-muted-foreground">
              คุณได้อ่านการแจ้งเตือนทั้งหมดแล้ว
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {initialNotifications.map((notif) => (
            <Card
              key={notif.id}
              className={`transition-colors ${!notif.isRead ? "border-l-4 border-l-primary bg-muted/50" : "opacity-70"}`}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex gap-4 items-start">
                  <div className="mt-1 flex-shrink-0">
                    {getSeverityIcon(notif.severity)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`font-semibold ${!notif.isRead ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {notif.title}
                        </h4>
                        {getSeverityBadge(notif.severity)}
                        {!notif.isRead && (
                          <Badge
                            variant="default"
                            className="text-[10px] h-5 px-1.5 rounded-full"
                          >
                            ใหม่
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground whitespace-nowrap">
                        <Clock className="mr-1 h-3 w-3" />
                        {format(
                          new Date(notif.createdAt),
                          "dd MMM yyyy HH:mm",
                          { locale: th },
                        )}
                      </div>
                    </div>
                    <p
                      className={`text-sm mt-2 ${!notif.isRead ? "text-foreground/90" : "text-muted-foreground"}`}
                    >
                      {notif.message}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                    {notif.link && (
                      <Link href={notif.link}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                        >
                          ดูรายละเอียด
                        </Button>
                      </Link>
                    )}
                    {!notif.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notif.id)}
                        disabled={isPending}
                        className="text-xs h-8"
                      >
                        รับทราบ
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchNotifications, fetchUnreadCount, timeAgo, type Notification } from "@/lib/notifications";

export function NotificationSummaryCard() {
  const [unread, setUnread] = useState(0);
  const [latest, setLatest] = useState<Notification | null>(null);

  useEffect(() => {
    (async () => {
      const [c, list] = await Promise.all([fetchUnreadCount(), fetchNotifications(1)]);
      setUnread(c);
      setLatest(list[0] ?? null);
    })();
  }, []);

  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Bell className="size-4" /> Notifications
        </CardTitle>
        {unread > 0 && (
          <span className="text-[10px] uppercase tracking-wide rounded-full bg-primary/10 text-primary px-2 py-0.5 font-semibold">
            {unread} unread
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {latest ? (
          <div>
            <p className="text-sm font-medium line-clamp-1">{latest.title}</p>
            {latest.body && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{latest.body}</p>}
            <p className="text-[11px] text-muted-foreground mt-1">{timeAgo(latest.created_at)}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">You're all caught up.</p>
        )}
        <Button variant="ghost" size="sm" className="w-full justify-between -ml-2" asChild>
          <Link to="/notifications">View all <ArrowRight className="size-4" /></Link>
        </Button>
      </CardContent>
    </Card>
  );
}
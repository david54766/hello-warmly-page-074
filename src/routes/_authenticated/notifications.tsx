import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/DashboardCard";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { Bell, CheckCheck, Filter } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchNotifications, markAllRead, markRead,
  NOTIFICATION_TYPE_LABELS, type Notification, type NotificationType,
} from "@/lib/notifications";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");

  const load = async () => {
    setLoading(true);
    try {
      setItems(await fetchNotifications(200));
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => typeFilter === "all" ? items : items.filter((n) => n.type === typeFilter),
    [items, typeFilter],
  );
  const unread = filtered.filter((n) => !n.read_at);
  const read = filtered.filter((n) => n.read_at);

  const handleMarkAll = async () => {
    if (!user) return;
    try {
      await markAllRead(user.id);
      toast.success("All notifications marked as read");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const handleMarkRead = async (id: string) => {
    try { await markRead(id); load(); } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  const renderList = (list: Notification[]) =>
    list.length === 0 ? (
      <EmptyState
        icon={<Bell className="size-5" />}
        title="You're all caught up."
        description="New notifications will appear here."
      />
    ) : (
      <ul className="divide-y rounded-2xl border bg-card">
        {list.map((n) => (
          <li key={n.id} className="px-1">
            <NotificationItem n={n} onMarkRead={handleMarkRead} />
          </li>
        ))}
      </ul>
    );

  return (
    <div className="max-w-3xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated on replies, reactions, events, lessons, and important platform activity.
          </p>
        </div>
        <Button variant="outline" onClick={handleMarkAll} disabled={items.every((n) => n.read_at)}>
          <CheckCheck className="size-4 mr-1.5" />Mark all read
        </Button>
      </header>

      <div className="flex items-center gap-2">
        <Filter className="size-4 text-muted-foreground" />
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
          <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(NOTIFICATION_TYPE_LABELS).map(([k, label]) => (
              <SelectItem key={k} value={k}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
            <TabsTrigger value="read">Read ({read.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="pt-4">{renderList(filtered)}</TabsContent>
          <TabsContent value="unread" className="pt-4">{renderList(unread)}</TabsContent>
          <TabsContent value="read" className="pt-4">{renderList(read)}</TabsContent>
        </Tabs>
      )}
    </div>
  );
}
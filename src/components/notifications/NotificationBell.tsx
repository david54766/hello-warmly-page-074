import { useEffect, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchNotifications, fetchUnreadCount, markRead, markAllRead,
  type Notification,
} from "@/lib/notifications";
import { NotificationItem } from "./NotificationItem";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [list, count] = await Promise.all([fetchNotifications(10), fetchUnreadCount()]);
    setItems(list);
    setUnread(count);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = (supabase as any)
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => refresh(),
      )
      .subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, [user, refresh]);

  // Refresh on open (catches anything missed)
  useEffect(() => { if (open) refresh(); }, [open, refresh]);

  const handleMarkAll = async () => {
    if (!user) return;
    await markAllRead(user.id);
    refresh();
  };

  const handleMarkRead = async (id: string) => {
    await markRead(id);
    refresh();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className={cn(
              "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1",
              "rounded-full bg-primary text-primary-foreground text-[10px] font-semibold",
              "grid place-items-center tabular-nums",
            )}>
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <div className="text-sm font-semibold">Notifications</div>
            <div className="text-xs text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "You're all caught up"}
            </div>
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={handleMarkAll}>
              <CheckCheck className="size-3.5 mr-1" />Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[420px]">
          {loading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="size-10 mx-auto rounded-full bg-muted grid place-items-center mb-2">
                <Bell className="size-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">You're all caught up</p>
              <p className="text-xs text-muted-foreground mt-1">New notifications will appear here.</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {items.map((n) => (
                <NotificationItem
                  key={n.id}
                  n={n}
                  compact
                  onMarkRead={handleMarkRead}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="border-t px-4 py-2.5">
          <Button variant="ghost" size="sm" className="w-full" asChild onClick={() => setOpen(false)}>
            <Link to="/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
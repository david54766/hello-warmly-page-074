import { Link } from "@tanstack/react-router";
import {
  MessageSquare, MessageCircle, Heart, Calendar, GraduationCap,
  Megaphone, Users2, ShieldAlert, Bell, Circle,
} from "lucide-react";
import type { Notification, NotificationType } from "@/lib/notifications";
import { timeAgo, targetLink } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  comment_on_post: MessageSquare,
  reply_to_comment: MessageCircle,
  reaction_to_post: Heart,
  reaction_to_comment: Heart,
  event_rsvp_confirmation: Calendar,
  lesson_completed: GraduationCap,
  admin_announcement: Megaphone,
  space_joined: Users2,
  report_status_updated: ShieldAlert,
};

export function NotificationItem({
  n,
  onMarkRead,
  onNavigate,
  compact,
}: {
  n: Notification;
  onMarkRead?: (id: string) => void;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const Icon = ICONS[n.type] ?? Bell;
  const link = targetLink(n);
  const unread = !n.read_at;

  const content = (
    <div className={cn(
      "flex gap-3 px-3 py-3 rounded-xl transition-colors",
      unread ? "bg-primary/5" : "bg-transparent",
      link && "hover:bg-accent cursor-pointer",
    )}>
      <div className={cn(
        "size-9 rounded-full grid place-items-center shrink-0",
        unread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
      )}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm leading-snug", unread && "font-medium")}>{n.title}</p>
          {unread && <Circle className="size-2 fill-primary text-primary shrink-0 mt-1.5" />}
        </div>
        {n.body && <p className={cn("text-xs mt-0.5 text-muted-foreground", compact && "line-clamp-2")}>{n.body}</p>}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</span>
          {unread && onMarkRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[11px]"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMarkRead(n.id); }}
            >
              Mark as read
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link
        to={link.to as any}
        params={link.params as any}
        onClick={() => { if (unread && onMarkRead) onMarkRead(n.id); onNavigate?.(); }}
        className="block"
      >
        {content}
      </Link>
    );
  }
  return content;
}
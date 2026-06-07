import { supabase } from "@/integrations/supabase/client";

export type NotificationType =
  | "comment_on_post"
  | "reply_to_comment"
  | "reaction_to_post"
  | "reaction_to_comment"
  | "event_rsvp_confirmation"
  | "lesson_completed"
  | "admin_announcement"
  | "space_joined"
  | "report_status_updated";

export type NotificationTarget =
  | "post"
  | "comment"
  | "event"
  | "lesson"
  | "course"
  | "space"
  | "user"
  | "announcement_placeholder";

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  target_type: NotificationTarget | null;
  target_id: string | null;
  actor_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationPreferences = {
  user_id: string;
  comments_enabled: boolean;
  replies_enabled: boolean;
  reactions_enabled: boolean;
  event_rsvps_enabled: boolean;
  lesson_progress_enabled: boolean;
  admin_announcements_enabled: boolean;
  email_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
};

const sb = supabase as any;

export async function fetchNotifications(limit = 50): Promise<Notification[]> {
  const { data, error } = await sb
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function fetchUnreadCount(): Promise<number> {
  const { count, error } = await sb
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}

export async function markRead(id: string) {
  const { error } = await sb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) throw error;
}

export async function markAllRead(userId: string) {
  const { error } = await sb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw error;
}

export async function fetchPreferences(userId: string): Promise<NotificationPreferences | null> {
  const { data } = await sb
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as NotificationPreferences) ?? null;
}

export async function savePreferences(prefs: NotificationPreferences) {
  const { error } = await sb
    .from("notification_preferences")
    .upsert(prefs, { onConflict: "user_id" });
  if (error) throw error;
}

export const DEFAULT_PREFERENCES = (userId: string): NotificationPreferences => ({
  user_id: userId,
  comments_enabled: true,
  replies_enabled: true,
  reactions_enabled: true,
  event_rsvps_enabled: true,
  lesson_progress_enabled: true,
  admin_announcements_enabled: true,
  email_notifications_enabled: false,
  push_notifications_enabled: false,
});

export function timeAgo(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const s = Math.floor(d / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function targetLink(
  n: Notification,
): { to: string; params: Record<string, string> } | null {
  if (!n.target_type || !n.target_id) return null;
  switch (n.target_type) {
    case "post":
    case "comment":
      return { to: "/posts/$postId", params: { postId: n.target_id } };
    case "event":
      return { to: "/events/$eventId", params: { eventId: n.target_id } };
    case "lesson":
      return { to: "/lessons/$lessonId", params: { lessonId: n.target_id } };
    case "course":
      return { to: "/courses/$courseId", params: { courseId: n.target_id } };
    case "space":
      return { to: "/spaces/$spaceId", params: { spaceId: n.target_id } };
    case "user":
      return { to: "/members/$userId", params: { userId: n.target_id } };
    default:
      return null;
  }
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  comment_on_post: "Comments",
  reply_to_comment: "Replies",
  reaction_to_post: "Reactions",
  reaction_to_comment: "Reactions",
  event_rsvp_confirmation: "Events",
  lesson_completed: "Lessons",
  admin_announcement: "Announcements",
  space_joined: "Spaces",
  report_status_updated: "Moderation",
};
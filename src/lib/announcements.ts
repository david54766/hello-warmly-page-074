import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type AnnouncementTargetType = "all_members" | "space" | "segment" | "plan" | "role";
export type AnnouncementDisplayType = "banner" | "feed_post" | "notification_only" | "modal_placeholder";
export type AnnouncementStatus = "draft" | "scheduled" | "sent" | "archived";

export interface AdminAnnouncement {
  id: string;
  title: string;
  body: string | null;
  target_type: AnnouncementTargetType;
  target_id: string | null;
  target_role: string | null;
  display_type: AnnouncementDisplayType;
  status: AnnouncementStatus;
  pinned: boolean;
  scheduled_at: string | null;
  sent_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const DISPLAY_OPTIONS: { value: AnnouncementDisplayType; label: string }[] = [
  { value: "banner", label: "Top banner" },
  { value: "feed_post", label: "Feed post (placeholder)" },
  { value: "notification_only", label: "Notification only" },
  { value: "modal_placeholder", label: "Modal (placeholder)" },
];

export const TARGET_OPTIONS: { value: AnnouncementTargetType; label: string }[] = [
  { value: "all_members", label: "All members" },
  { value: "space", label: "Members of a Space" },
  { value: "segment", label: "Members of a Segment" },
  { value: "plan", label: "Subscribers to a Plan" },
  { value: "role", label: "Users with a Role" },
];

export const STATUS_OPTIONS: { value: AnnouncementStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sent", label: "Sent" },
  { value: "archived", label: "Archived" },
];

export async function listAnnouncementsAdmin(): Promise<AdminAnnouncement[]> {
  const { data, error } = await db.from("admin_announcements").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AdminAnnouncement[];
}

export async function getAnnouncement(id: string): Promise<AdminAnnouncement | null> {
  const { data, error } = await db.from("admin_announcements").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as AdminAnnouncement | null;
}

export async function createAnnouncement(input: Partial<AdminAnnouncement>): Promise<AdminAnnouncement> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await db.from("admin_announcements").insert({
    title: input.title,
    body: input.body ?? null,
    target_type: input.target_type ?? "all_members",
    target_id: input.target_id ?? null,
    target_role: input.target_role ?? null,
    display_type: input.display_type ?? "banner",
    status: input.status ?? "draft",
    pinned: input.pinned ?? false,
    scheduled_at: input.scheduled_at ?? null,
    created_by: userData.user?.id ?? null,
  }).select().single();
  if (error) throw error;
  return data as AdminAnnouncement;
}

export async function updateAnnouncement(id: string, patch: Partial<AdminAnnouncement>): Promise<void> {
  const { error } = await db.from("admin_announcements").update({
    title: patch.title,
    body: patch.body,
    target_type: patch.target_type,
    target_id: patch.target_id,
    target_role: patch.target_role,
    display_type: patch.display_type,
    status: patch.status,
    pinned: patch.pinned,
    scheduled_at: patch.scheduled_at,
  }).eq("id", id);
  if (error) throw error;
}

export async function archiveAnnouncement(id: string): Promise<void> {
  const { error } = await db.from("admin_announcements").update({ status: "archived" }).eq("id", id);
  if (error) throw error;
}

export async function setPinned(id: string, pinned: boolean): Promise<void> {
  const { error } = await db.from("admin_announcements").update({ pinned }).eq("id", id);
  if (error) throw error;
}

export async function sendAnnouncement(id: string): Promise<number> {
  const { data, error } = await db.rpc("send_announcement", { _announcement_id: id });
  if (error) throw error;
  return Number(data ?? 0);
}

/** Active (sent + non-archived) announcements visible to the current user via RLS. */
export async function listMyAnnouncements(): Promise<AdminAnnouncement[]> {
  const { data, error } = await db
    .from("admin_announcements")
    .select("*")
    .eq("status", "sent")
    .order("pinned", { ascending: false })
    .order("sent_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AdminAnnouncement[];
}

export async function listMyDismissedIds(): Promise<string[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data } = await db
    .from("announcement_views")
    .select("announcement_id, dismissed")
    .eq("user_id", userData.user.id)
    .eq("dismissed", true);
  return (data ?? []).map((r: any) => r.announcement_id);
}

export async function recordView(announcementId: string, dismissed = false): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  await db.from("announcement_views").upsert({
    announcement_id: announcementId,
    user_id: userData.user.id,
    viewed_at: new Date().toISOString(),
    dismissed,
  }, { onConflict: "announcement_id,user_id" });
}

export async function viewStats(announcementId: string): Promise<{ views: number; dismissed: number }> {
  const [{ count: v }, { count: d }] = await Promise.all([
    db.from("announcement_views").select("*", { count: "exact", head: true }).eq("announcement_id", announcementId),
    db.from("announcement_views").select("*", { count: "exact", head: true }).eq("announcement_id", announcementId).eq("dismissed", true),
  ]);
  return { views: v ?? 0, dismissed: d ?? 0 };
}
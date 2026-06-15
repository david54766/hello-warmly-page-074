import { supabase } from "@/integrations/supabase/client";

export type ChecklistActionType =
  | "complete_profile" | "join_space" | "create_first_post" | "comment_on_post"
  | "follow_member" | "rsvp_event" | "start_course" | "complete_lesson"
  | "update_notifications";

export type ChecklistTargetType =
  | "profile" | "space" | "post" | "event" | "course" | "lesson" | "settings" | "member";

export type SavedTargetType =
  | "post" | "course" | "lesson" | "event" | "space" | "resource" | "resource_placeholder";

export interface ChecklistItem {
  id: string;
  title: string;
  description: string | null;
  action_type: ChecklistActionType;
  target_type: ChecklistTargetType | null;
  target_id: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistProgress {
  id: string;
  user_id: string;
  checklist_item_id: string;
  completed_at: string;
  created_at: string;
}

export interface SavedItem {
  id: string;
  user_id: string;
  target_type: SavedTargetType;
  target_id: string;
  created_at: string;
}

export interface FollowRow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export const ACTION_LABELS: Record<ChecklistActionType, string> = {
  complete_profile: "Edit profile",
  join_space: "Browse Spaces",
  create_first_post: "Open feed",
  comment_on_post: "Open feed",
  follow_member: "Find members",
  rsvp_event: "Browse events",
  start_course: "Browse courses",
  complete_lesson: "Browse courses",
  update_notifications: "Open settings",
};

export function actionRoute(action: ChecklistActionType): string {
  switch (action) {
    case "complete_profile": return "/profile";
    case "join_space": return "/spaces";
    case "create_first_post":
    case "comment_on_post": return "/feed";
    case "follow_member": return "/members";
    case "rsvp_event": return "/events";
    case "start_course":
    case "complete_lesson": return "/courses";
    case "update_notifications": return "/settings/notifications";
    default: return "/dashboard";
  }
}

export async function fetchChecklistItems(includeInactive = false): Promise<ChecklistItem[]> {
  let q = supabase.from("welcome_checklist_items").select("*").order("sort_order");
  if (!includeInactive) q = q.eq("active", true);
  const { data } = await q;
  return (data ?? []) as ChecklistItem[];
}

export async function fetchChecklistProgress(userId: string): Promise<ChecklistProgress[]> {
  const { data } = await supabase.from("welcome_checklist_progress").select("*").eq("user_id", userId);
  return (data ?? []) as ChecklistProgress[];
}

export async function markChecklistComplete(userId: string, itemId: string) {
  const { error } = await supabase
    .from("welcome_checklist_progress")
    .upsert({ user_id: userId, checklist_item_id: itemId }, { onConflict: "user_id,checklist_item_id" });
  if (error) throw error;
}

export async function upsertChecklistItem(
  values: Partial<ChecklistItem> & { title: string; action_type: ChecklistActionType }
) {
  if (values.id) {
    const { id, ...rest } = values;
    const { error } = await supabase.from("welcome_checklist_items").update(rest as any).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("welcome_checklist_items").insert(values as any);
    if (error) throw error;
  }
}

export async function deleteChecklistItem(id: string) {
  const { error } = await supabase.from("welcome_checklist_items").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderChecklistItem(id: string, sort_order: number) {
  await supabase.from("welcome_checklist_items").update({ sort_order }).eq("id", id);
}

// ===== Saved items =====
export async function fetchSaved(userId: string): Promise<SavedItem[]> {
  const { data } = await supabase.from("saved_items").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return (data ?? []) as SavedItem[];
}

export async function isSaved(userId: string, target_type: SavedTargetType, target_id: string): Promise<boolean> {
  const { data } = await supabase
    .from("saved_items").select("id").eq("user_id", userId)
    .eq("target_type", target_type).eq("target_id", target_id).maybeSingle();
  return !!data;
}

export async function toggleSaved(userId: string, target_type: SavedTargetType, target_id: string): Promise<boolean> {
  const saved = await isSaved(userId, target_type, target_id);
  if (saved) {
    await supabase.from("saved_items").delete().eq("user_id", userId).eq("target_type", target_type).eq("target_id", target_id);
    return false;
  }
  await supabase.from("saved_items").insert({ user_id: userId, target_type, target_id });
  return true;
}

// ===== Follows =====
export async function fetchFollowing(userId: string): Promise<string[]> {
  const { data } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
  return (data ?? []).map((r: any) => r.following_id as string);
}

export async function fetchFollowers(userId: string): Promise<string[]> {
  const { data } = await supabase.from("follows").select("follower_id").eq("following_id", userId);
  return (data ?? []).map((r: any) => r.follower_id as string);
}

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) throw new Error("You can't follow yourself");
  const { error } = await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
  if (error && !`${error.message}`.includes("duplicate")) throw error;
}

export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await supabase.from("follows").delete().eq("follower_id", followerId).eq("following_id", followingId);
  if (error) throw error;
}

export async function followCounts(userId: string): Promise<{ followers: number; following: number }> {
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  return { followers: followers ?? 0, following: following ?? 0 };
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data } = await supabase
    .from("follows").select("id").eq("follower_id", followerId).eq("following_id", followingId).maybeSingle();
  return !!data;
}
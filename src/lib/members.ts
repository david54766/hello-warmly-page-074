import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/hooks/useAuth";

export type MemberStatus = "active" | "inactive" | "suspended" | "removed";

export interface MemberProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  bio: string | null;
  location: string | null;
  headline: string | null;
  website_url: string | null;
  social_links_json: Record<string, string> | null;
  status: MemberStatus;
  onboarding_completed: boolean;
  created_at: string;
  last_active_at: string | null;
}

export interface MemberSummary extends MemberProfile {
  roles: AppRole[];
  spaces_joined: number;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  platform_admin: "Platform Admin",
  moderator: "Moderator",
  space_host: "Space Host",
  member: "Member",
  limited_member: "Limited Member",
};

export const STATUS_LABELS: Record<MemberStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
  removed: "Removed",
};

export const ALL_ROLES: AppRole[] = ["platform_admin", "moderator", "space_host", "member", "limited_member"];
export const ALL_STATUSES: MemberStatus[] = ["active", "inactive", "suspended", "removed"];

export function highestRole(roles: AppRole[]): AppRole {
  const order: AppRole[] = ["platform_admin", "moderator", "space_host", "member", "limited_member"];
  for (const r of order) if (roles.includes(r)) return r;
  return "member";
}

export function memberInitials(name: string | null | undefined, fallback?: string | null) {
  const src = (name || fallback || "?").trim();
  const parts = src.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function fetchMembers(): Promise<MemberSummary[]> {
  const [{ data: profs }, { data: roleRows }, { data: memRows }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
    supabase.from("space_members").select("user_id").eq("status", "active"),
  ]);
  const rolesByUser = new Map<string, AppRole[]>();
  (roleRows ?? []).forEach((r: any) => {
    const arr = rolesByUser.get(r.user_id) ?? [];
    arr.push(r.role as AppRole);
    rolesByUser.set(r.user_id, arr);
  });
  const spacesByUser = new Map<string, number>();
  (memRows ?? []).forEach((r: any) => spacesByUser.set(r.user_id, (spacesByUser.get(r.user_id) ?? 0) + 1));
  return (profs ?? []).map((p: any) => ({
    ...p,
    social_links_json: p.social_links_json ?? {},
    roles: rolesByUser.get(p.id) ?? [],
    spaces_joined: spacesByUser.get(p.id) ?? 0,
  })) as MemberSummary[];
}

export async function fetchMember(userId: string): Promise<MemberSummary | null> {
  const { data: prof } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!prof) return null;
  const [{ data: roleRows }, { count: spacesJoined }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("space_members").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "active"),
  ]);
  return {
    ...(prof as any),
    social_links_json: (prof as any).social_links_json ?? {},
    roles: ((roleRows ?? []) as any[]).map((r) => r.role as AppRole),
    spaces_joined: spacesJoined ?? 0,
  };
}

export interface ActivitySummary {
  posts: number;
  comments: number;
  lessons_completed: number;
  courses_started: number;
  events_rsvped: number;
  spaces_joined: number;
  last_activity_at: string | null;
}

export async function fetchActivity(userId: string): Promise<ActivitySummary> {
  const [{ count: posts }, { count: comments }, { count: lessons }, { count: courses }, { count: events }, { count: spaces }] = await Promise.all([
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("author_id", userId).eq("status", "active"),
    supabase.from("comments").select("*", { count: "exact", head: true }).eq("author_id", userId).eq("status", "active"),
    supabase.from("lesson_progress").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed"),
    supabase.from("lesson_progress").select("*", { count: "exact", head: true }).eq("user_id", userId),
    (supabase as any).from("event_rsvps").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "going"),
    supabase.from("space_members").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "active"),
  ]);
  const { data: prof } = await supabase.from("profiles").select("last_active_at").eq("id", userId).maybeSingle();
  return {
    posts: posts ?? 0,
    comments: comments ?? 0,
    lessons_completed: lessons ?? 0,
    courses_started: courses ?? 0,
    events_rsvped: events ?? 0,
    spaces_joined: spaces ?? 0,
    last_activity_at: (prof as any)?.last_active_at ?? null,
  };
}

export async function updateMemberStatus(userId: string, status: MemberStatus) {
  const { error } = await supabase.from("profiles").update({ status }).eq("id", userId);
  if (error) throw error;
}

export async function setUserRole(userId: string, role: AppRole) {
  // Replace all roles with the single chosen role (simple model for Phase 1F)
  const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
  if (delErr) throw delErr;
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
  if (error) throw error;
}

export function formatJoined(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export function relativeTime(date: string | null | undefined) {
  if (!date) return "Never";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}
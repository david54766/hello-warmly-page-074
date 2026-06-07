import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

export type BadgeType = "manual" | "milestone" | "course" | "event" | "community" | "special";
export type PointsSourceType =
  | "profile_complete" | "space_joined" | "post_created" | "comment_created"
  | "reaction_received" | "event_rsvp" | "course_started" | "lesson_completed"
  | "checklist_completed" | "follow_member" | "manual" | "badge_awarded";
export type LeaderboardPeriod = "all_time" | "month" | "week";

export type Badge = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  badge_type: BadgeType;
  points_value: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type UserBadge = {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  awarded_by: string | null;
  award_reason: string | null;
  source_type: string | null;
  source_id: string | null;
  badge?: Badge;
};

export type PointsEntry = {
  id: string;
  user_id: string;
  points: number;
  reason: string | null;
  source_type: PointsSourceType;
  source_id: string | null;
  created_at: string;
};

export type LeaderboardRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  headline: string | null;
  points: number;
  badges_count: number;
  top_source: PointsSourceType | null;
};

export const POINT_VALUES: Record<PointsSourceType, number> = {
  profile_complete: 25,
  space_joined: 10,
  post_created: 20,
  comment_created: 10,
  reaction_received: 5,
  event_rsvp: 15,
  course_started: 15,
  lesson_completed: 25,
  checklist_completed: 50,
  follow_member: 5,
  manual: 0,
  badge_awarded: 0,
};

export const SOURCE_LABELS: Record<PointsSourceType, string> = {
  profile_complete: "Profile complete",
  space_joined: "Joined a Space",
  post_created: "Created a post",
  comment_created: "Commented",
  reaction_received: "Received a reaction",
  event_rsvp: "RSVP'd to an event",
  course_started: "Started a lesson",
  lesson_completed: "Completed a lesson",
  checklist_completed: "Completed onboarding",
  follow_member: "Followed a member",
  manual: "Manual adjustment",
  badge_awarded: "Badge earned",
};

export async function fetchBadges(includeInactive = false): Promise<Badge[]> {
  let q = sb.from("badges").select("*").order("name");
  if (!includeInactive) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Badge[];
}

export async function upsertBadge(input: Partial<Badge> & { name: string; slug: string }): Promise<Badge> {
  const payload: any = {
    slug: input.slug,
    name: input.name,
    description: input.description ?? null,
    icon_url: input.icon_url ?? null,
    badge_type: input.badge_type ?? "manual",
    points_value: input.points_value ?? 0,
    active: input.active ?? true,
  };
  if (input.id) {
    const { data, error } = await sb.from("badges").update(payload).eq("id", input.id).select("*").single();
    if (error) throw error;
    return data as Badge;
  }
  const { data, error } = await sb.from("badges").insert(payload).select("*").single();
  if (error) throw error;
  return data as Badge;
}

export async function deleteBadge(id: string) {
  const { error } = await sb.from("badges").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchUserBadges(userId: string): Promise<UserBadge[]> {
  const { data, error } = await sb
    .from("user_badges")
    .select("*, badge:badges(*)")
    .eq("user_id", userId)
    .order("awarded_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserBadge[];
}

export async function awardBadgeManual(userId: string, badgeSlug: string, reason: string | null, awardedBy: string) {
  const { data, error } = await sb.rpc("award_badge_by_slug", {
    _user_id: userId, _slug: badgeSlug, _reason: reason, _awarded_by: awardedBy,
  });
  if (error) throw error;
  return data;
}

export async function removeBadge(userBadgeId: string) {
  const { error } = await sb.from("user_badges").delete().eq("id", userBadgeId);
  if (error) throw error;
}

export async function fetchUserPointsTotal(userId: string): Promise<number> {
  const { data, error } = await sb.from("points_ledger").select("points").eq("user_id", userId);
  if (error) return 0;
  return (data ?? []).reduce((s: number, r: any) => s + (r.points ?? 0), 0);
}

export async function fetchUserPointsLedger(userId: string, limit = 50): Promise<PointsEntry[]> {
  const { data, error } = await sb
    .from("points_ledger").select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as PointsEntry[];
}

export async function fetchAllPointsLedger(filters: { sourceType?: PointsSourceType | null; userId?: string | null; limit?: number } = {}): Promise<PointsEntry[]> {
  let q = sb.from("points_ledger").select("*").order("created_at", { ascending: false }).limit(filters.limit ?? 100);
  if (filters.sourceType) q = q.eq("source_type", filters.sourceType);
  if (filters.userId) q = q.eq("user_id", filters.userId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PointsEntry[];
}

export async function manualAdjustPoints(userId: string, points: number, reason: string) {
  const { error } = await sb.from("points_ledger").insert({
    user_id: userId,
    points,
    reason,
    source_type: "manual",
  });
  if (error) throw error;
}

function periodStart(period: LeaderboardPeriod): string | null {
  if (period === "all_time") return null;
  const ms = period === "week" ? 7 * 86400_000 : 30 * 86400_000;
  return new Date(Date.now() - ms).toISOString();
}

export async function fetchLeaderboard(period: LeaderboardPeriod = "all_time", limit = 25): Promise<LeaderboardRow[]> {
  const start = periodStart(period);
  let q = sb.from("points_ledger").select("user_id, points, source_type, created_at");
  if (start) q = q.gte("created_at", start);
  const { data: rows, error } = await q;
  if (error) throw error;
  const totals = new Map<string, { points: number; sources: Record<string, number> }>();
  (rows ?? []).forEach((r: any) => {
    const t = totals.get(r.user_id) ?? { points: 0, sources: {} };
    t.points += r.points;
    t.sources[r.source_type] = (t.sources[r.source_type] ?? 0) + r.points;
    totals.set(r.user_id, t);
  });
  const userIds = Array.from(totals.keys());
  if (userIds.length === 0) return [];
  const [{ data: profiles }, { data: badgeRows }] = await Promise.all([
    sb.from("profiles").select("id, full_name, email, avatar_url, headline").in("id", userIds),
    sb.from("user_badges").select("user_id").in("user_id", userIds),
  ]);
  const badgeCount = new Map<string, number>();
  (badgeRows ?? []).forEach((b: any) => badgeCount.set(b.user_id, (badgeCount.get(b.user_id) ?? 0) + 1));
  const profilesById = new Map<string, any>((profiles ?? []).map((p: any) => [p.id, p]));
  const result: LeaderboardRow[] = userIds.map((uid) => {
    const t = totals.get(uid)!;
    const p = profilesById.get(uid);
    const topSource = Object.entries(t.sources).sort((a, b) => b[1] - a[1])[0]?.[0] as PointsSourceType | undefined;
    return {
      user_id: uid,
      full_name: p?.full_name ?? null,
      email: p?.email ?? null,
      avatar_url: p?.avatar_url ?? null,
      headline: p?.headline ?? null,
      points: t.points,
      badges_count: badgeCount.get(uid) ?? 0,
      top_source: topSource ?? null,
    };
  });
  return result.sort((a, b) => b.points - a.points).slice(0, limit);
}

export function pointsAdminTotals(rows: PointsEntry[]) {
  const total = rows.reduce((s, r) => s + r.points, 0);
  const byType = new Map<PointsSourceType, number>();
  rows.forEach((r) => byType.set(r.source_type, (byType.get(r.source_type) ?? 0) + r.points));
  return { total, byType };
}
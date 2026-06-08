import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export interface SegmentCondition {
  type: string;
  value?: string;
}

export interface Segment {
  id: string;
  name: string;
  description: string | null;
  conditions_json: SegmentCondition[];
  match_mode: "all" | "any";
  active: boolean;
  created_by: string | null;
  last_refreshed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SegmentMember {
  id: string;
  segment_id: string;
  user_id: string;
  matched_at: string;
}

export const CONDITION_TYPES: { value: string; label: string; placeholder?: string }[] = [
  { value: "role", label: "Role equals", placeholder: "member | platform_admin" },
  { value: "status", label: "Profile status equals", placeholder: "active | suspended" },
  { value: "tag", label: "Has tag", placeholder: "VIP" },
  { value: "badge", label: "Has badge (slug or id)", placeholder: "course_starter" },
  { value: "points_above", label: "Points greater than", placeholder: "500" },
  { value: "points_below", label: "Points less than", placeholder: "100" },
  { value: "plan", label: "On plan (plan id)", placeholder: "plan uuid" },
  { value: "subscription_status", label: "Subscription status", placeholder: "active | trialing | past_due | canceled" },
  { value: "space_membership", label: "Is in Space (id)", placeholder: "space uuid" },
  { value: "course_progress", label: "Completed lesson in course (id)", placeholder: "course uuid" },
  { value: "event_rsvp", label: "RSVPed to event (id)", placeholder: "event uuid" },
  { value: "last_active_before", label: "Last active more than (interval)", placeholder: "30 days" },
  { value: "onboarding_completed", label: "Onboarding completed equals", placeholder: "true | false" },
  { value: "joined_after", label: "Joined after (ISO date)", placeholder: "2024-01-01" },
  { value: "joined_before", label: "Joined before (ISO date)", placeholder: "2025-01-01" },
  { value: "no_posts", label: "Has not posted yet" },
];

export function conditionLabel(type: string): string {
  return CONDITION_TYPES.find((c) => c.value === type)?.label ?? type;
}

export async function listSegments(): Promise<Segment[]> {
  const { data, error } = await db.from("segments").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Segment[];
}

export async function getSegment(id: string): Promise<Segment | null> {
  const { data, error } = await db.from("segments").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Segment | null;
}

export async function createSegment(input: Partial<Segment>): Promise<Segment> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await db.from("segments").insert({
    name: input.name,
    description: input.description ?? null,
    conditions_json: input.conditions_json ?? [],
    match_mode: input.match_mode ?? "all",
    active: input.active ?? true,
    created_by: userData.user?.id ?? null,
  }).select().single();
  if (error) throw error;
  return data as Segment;
}

export async function updateSegment(id: string, patch: Partial<Segment>): Promise<void> {
  const { error } = await db.from("segments").update({
    name: patch.name,
    description: patch.description,
    conditions_json: patch.conditions_json,
    match_mode: patch.match_mode,
    active: patch.active,
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteSegment(id: string): Promise<void> {
  const { error } = await db.from("segments").delete().eq("id", id);
  if (error) throw error;
}

export async function refreshSegment(id: string): Promise<number> {
  const { data, error } = await db.rpc("refresh_segment", { _segment_id: id });
  if (error) throw error;
  return Number(data ?? 0);
}

export async function listSegmentMembers(segmentId: string, limit = 200): Promise<SegmentMember[]> {
  const { data, error } = await db.from("segment_members").select("*").eq("segment_id", segmentId).order("matched_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as SegmentMember[];
}

export async function segmentMemberCount(segmentId: string): Promise<number> {
  const { count, error } = await db.from("segment_members").select("*", { count: "exact", head: true }).eq("segment_id", segmentId);
  if (error) throw error;
  return count ?? 0;
}
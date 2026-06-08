import { supabase } from "@/integrations/supabase/client";

export type EventType =
  | "in_person"
  | "virtual"
  | "workshop"
  | "community_call"
  | "course_session"
  | "livestream_placeholder";

export type EventVisibility = "public" | "members_only" | "space_members" | "hidden";
export type EventAccess = "free" | "preview" | "paid" | "paid_placeholder";
export type EventStatus = "draft" | "published" | "canceled" | "completed";
export type RsvpStatus = "going" | "not_going" | "waitlist";

export interface EventRow {
  id: string;
  space_id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  start_time: string;
  end_time: string;
  timezone: string;
  location: string | null;
  virtual_link: string | null;
  cover_image_url: string | null;
  rsvp_limit: number | null;
  visibility: EventVisibility;
  access_level: EventAccess;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RsvpRow {
  id: string;
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  created_at: string;
  updated_at: string;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  in_person: "In person",
  virtual: "Virtual",
  workshop: "Workshop",
  community_call: "Community call",
  course_session: "Course session",
  livestream_placeholder: "Livestream (soon)",
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Draft",
  published: "Published",
  canceled: "Canceled",
  completed: "Completed",
};

export const VISIBILITY_LABELS: Record<EventVisibility, string> = {
  public: "Public",
  members_only: "Members only",
  space_members: "Space members",
  hidden: "Hidden",
};

export const ACCESS_LABELS: Record<EventAccess, string> = {
  free: "Free",
  preview: "Preview",
  paid: "Paid",
  paid_placeholder: "Paid",
};

export function formatEventDate(iso: string, tz?: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz && tz !== "UTC" ? tz : undefined,
  });
}

export function isPast(e: Pick<EventRow, "end_time" | "status">) {
  return e.status === "completed" || new Date(e.end_time).getTime() < Date.now();
}

export function isLocked(e: Pick<EventRow, "access_level">) {
  return e.access_level === "paid" || e.access_level === "paid_placeholder";
}

// Untyped client (events tables not yet in generated types)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sbEvents: any = supabase;

export async function fetchEvents(filters?: {
  spaceId?: string;
  upcomingOnly?: boolean;
  pastOnly?: boolean;
}): Promise<EventRow[]> {
  let q = sbEvents.from("events").select("*").order("start_time", { ascending: true });
  if (filters?.spaceId) q = q.eq("space_id", filters.spaceId);
  if (filters?.upcomingOnly) q = q.gte("end_time", new Date().toISOString());
  if (filters?.pastOnly) q = q.lt("end_time", new Date().toISOString());
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as EventRow[];
}

export async function fetchEvent(id: string): Promise<EventRow | null> {
  const { data } = await sbEvents.from("events").select("*").eq("id", id).maybeSingle();
  return (data as unknown as EventRow) ?? null;
}

export async function fetchRsvps(eventId: string): Promise<RsvpRow[]> {
  const { data } = await sbEvents.from("event_rsvps").select("*").eq("event_id", eventId);
  return (data ?? []) as unknown as RsvpRow[];
}

export async function setRsvp(eventId: string, userId: string, status: RsvpStatus) {
  const { error } = await sbEvents.from("event_rsvps").upsert(
    { event_id: eventId, user_id: userId, status },
    { onConflict: "event_id,user_id" }
  );
  if (error) throw error;
}

export async function deleteRsvp(eventId: string, userId: string) {
  const { error } = await sbEvents.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", userId);
  if (error) throw error;
}
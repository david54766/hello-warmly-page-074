import { supabase } from "@/integrations/supabase/client";

export const FLAG_TARGETS = ["post","comment","message","user","event","course","lesson","announcement"] as const;
export const FLAG_TYPES = ["spam","harassment","inappropriate","misinformation","off_topic","security_concern","other"] as const;
export const FLAG_SEVERITIES = ["low","medium","high","urgent"] as const;
export const FLAG_STATUSES = ["open","under_review","resolved","dismissed"] as const;
export const WARNING_TYPES = ["general","content_violation","behavior","spam","harassment","final_warning"] as const;
export const WARNING_STATUSES = ["active","acknowledged","dismissed"] as const;

export type FlagTarget = typeof FLAG_TARGETS[number];
export type FlagType = typeof FLAG_TYPES[number];
export type FlagSeverity = typeof FLAG_SEVERITIES[number];
export type FlagStatus = typeof FLAG_STATUSES[number];
export type WarningType = typeof WARNING_TYPES[number];
export type WarningStatus = typeof WARNING_STATUSES[number];

export interface ContentFlag {
  id: string;
  target_type: FlagTarget;
  target_id: string;
  flag_type: FlagType;
  severity: FlagSeverity;
  status: FlagStatus;
  created_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface ModeratorNote {
  id: string;
  user_id: string | null;
  target_type: string | null;
  target_id: string | null;
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface UserWarning {
  id: string;
  user_id: string;
  warning_type: WarningType;
  reason: string;
  issued_by: string | null;
  issued_at: string;
  acknowledged_at: string | null;
  status: WarningStatus;
}

const sb = supabase as any;

export async function listFlags(status?: FlagStatus) {
  let q = sb.from("content_flags").select("*").order("created_at", { ascending: false }).limit(200);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ContentFlag[];
}

export async function createFlag(input: {
  target_type: FlagTarget; target_id: string; flag_type: FlagType; severity: FlagSeverity; notes?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await sb.from("content_flags").insert({ ...input, created_by: user?.id });
  if (error) throw error;
}

export async function updateFlag(id: string, patch: Partial<Pick<ContentFlag, "status"|"severity"|"notes"|"flag_type">>) {
  const { data: { user } } = await supabase.auth.getUser();
  const upd: any = { ...patch };
  if (patch.status === "resolved" || patch.status === "dismissed") {
    upd.reviewed_by = user?.id;
    upd.reviewed_at = new Date().toISOString();
  }
  const { error } = await sb.from("content_flags").update(upd).eq("id", id);
  if (error) throw error;
}

export async function listNotes(userId?: string) {
  let q = sb.from("moderator_notes").select("*").order("created_at", { ascending: false }).limit(100);
  if (userId) q = q.eq("user_id", userId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ModeratorNote[];
}

export async function addNote(userId: string, note: string, target_type?: string, target_id?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await sb.from("moderator_notes").insert({ user_id: userId, note, target_type, target_id, created_by: user?.id });
  if (error) throw error;
}

export async function listWarnings(userId?: string) {
  let q = sb.from("user_warnings").select("*").order("issued_at", { ascending: false }).limit(200);
  if (userId) q = q.eq("user_id", userId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as UserWarning[];
}

export async function issueWarning(userId: string, type: WarningType, reason: string) {
  const { error } = await sb.rpc("issue_warning", { _user_id: userId, _type: type, _reason: reason });
  if (error) throw error;
}

export async function acknowledgeWarning(id: string) {
  const { error } = await sb.from("user_warnings").update({ status: "acknowledged", acknowledged_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function suspendUser(userId: string, reason: string) {
  const { error } = await sb.rpc("suspend_user", { _user_id: userId, _reason: reason });
  if (error) throw error;
}

export async function reactivateUser(userId: string) {
  const { error } = await sb.rpc("reactivate_user", { _user_id: userId });
  if (error) throw error;
}

export const SEVERITY_TONE: Record<FlagSeverity, string> = {
  low: "bg-muted text-foreground",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  high: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  urgent: "bg-destructive/15 text-destructive",
};

export const WARNING_TONE: Record<WarningStatus, string> = {
  active: "bg-destructive/15 text-destructive",
  acknowledged: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  dismissed: "bg-muted text-muted-foreground",
};
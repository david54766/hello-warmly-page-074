import { supabase } from "@/integrations/supabase/client";

export type AuditTargetType =
  | "user" | "space" | "post" | "comment" | "message" | "course" | "lesson"
  | "event" | "plan" | "coupon" | "bundle" | "automation" | "announcement"
  | "segment" | "access_grant" | "badge" | "points" | "settings" | "subscription" | "other";

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action_type: string;
  target_type: AuditTargetType | null;
  target_id: string | null;
  details_json: Record<string, unknown>;
  created_at: string;
}

const sb = supabase as any;

export async function logAudit(action: string, target_type: AuditTargetType, target_id: string | null, details: Record<string, unknown> = {}) {
  try {
    await sb.rpc("log_audit", { _action: action, _target_type: target_type, _target_id: target_id, _details: details });
  } catch {
    // never break caller
  }
}

export interface AuditFilters {
  actorId?: string;
  action?: string;
  targetType?: AuditTargetType;
  from?: string;
  to?: string;
}

export async function listAudit(filters: AuditFilters = {}, limit = 200) {
  let q = sb.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (filters.actorId) q = q.eq("actor_id", filters.actorId);
  if (filters.action) q = q.eq("action_type", filters.action);
  if (filters.targetType) q = q.eq("target_type", filters.targetType);
  if (filters.from) q = q.gte("created_at", filters.from);
  if (filters.to) q = q.lte("created_at", filters.to);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AuditLog[];
}

export const AUDIT_ACTIONS = [
  "settings_updated","user_role_changed","user_status_changed","user_suspended","user_reactivated",
  "space_created","space_updated","space_archived","post_hidden","post_restored",
  "comment_hidden","message_hidden","course_created","course_updated","event_created","event_canceled",
  "plan_created","coupon_created","access_granted","access_revoked","automation_created","automation_disabled",
  "announcement_sent","segment_created","badge_awarded_manual","points_awarded_manual","warning_issued",
] as const;
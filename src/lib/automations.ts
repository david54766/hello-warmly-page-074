import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type AutomationLogStatus = "pending" | "success" | "failed" | "skipped";

export interface AutomationCondition {
  type: string;
  value?: string | number | null;
}

export interface AutomationAction {
  type: string;
  value?: string | number | null;
}

export interface Automation {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  conditions_json: AutomationCondition[];
  actions_json: AutomationAction[];
  active: boolean;
  created_by: string | null;
  last_run_at: string | null;
  total_runs: number;
  error_count: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationLog {
  id: string;
  automation_id: string;
  user_id: string | null;
  trigger_type: string;
  status: AutomationLogStatus;
  details_json: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
}

export const TRIGGER_OPTIONS: { value: string; label: string }[] = [
  { value: "member_joins_platform", label: "Member joins the platform" },
  { value: "member_joins_space", label: "Member joins a Space" },
  { value: "member_completes_lesson", label: "Member completes a lesson" },
  { value: "member_rsvps_event", label: "Member RSVPs to an event" },
  { value: "member_becomes_inactive", label: "Member becomes inactive" },
  { value: "subscription_active", label: "Subscription becomes active" },
];

export const CONDITION_OPTIONS: { value: string; label: string; needsValue?: boolean }[] = [
  { value: "has_tag", label: "Member has tag", needsValue: true },
  { value: "is_in_space", label: "Member is in Space", needsValue: true },
  { value: "is_on_plan", label: "Member is on plan", needsValue: true },
  { value: "completed_course", label: "Member has completed course", needsValue: true },
  { value: "points_above", label: "Member has more than X points", needsValue: true },
];

export const ACTION_OPTIONS: { value: string; label: string; needsValue?: boolean }[] = [
  { value: "send_notification", label: "Send notification", needsValue: true },
  { value: "add_tag", label: "Add tag", needsValue: true },
  { value: "award_badge", label: "Award badge", needsValue: true },
  { value: "award_points", label: "Award points", needsValue: true },
  { value: "invite_to_space", label: "Invite to Space", needsValue: true },
  { value: "grant_access", label: "Grant access", needsValue: true },
  { value: "notify_admin", label: "Notify admin" },
];

export function triggerLabel(v: string) {
  return TRIGGER_OPTIONS.find((o) => o.value === v)?.label ?? v;
}
export function conditionLabel(v: string) {
  return CONDITION_OPTIONS.find((o) => o.value === v)?.label ?? v;
}
export function actionLabel(v: string) {
  return ACTION_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

export function buildPreview(a: Pick<Automation, "trigger_type" | "conditions_json" | "actions_json">) {
  const t = triggerLabel(a.trigger_type).toLowerCase();
  const conds = (a.conditions_json ?? []).map((c) => {
    const base = conditionLabel(c.type).toLowerCase();
    return c.value ? `${base} "${c.value}"` : base;
  });
  const acts = (a.actions_json ?? []).map((c) => {
    const base = actionLabel(c.type).toLowerCase();
    return c.value ? `${base} "${c.value}"` : base;
  });
  const condStr = conds.length ? ` and ${conds.join(" and ")}` : "";
  const actStr = acts.length ? acts.join(" and ") : "do nothing";
  return `When ${t}${condStr}, ${actStr}.`;
}

export async function fetchAutomations(): Promise<Automation[]> {
  const { data } = await db.from("automations").select("*").order("created_at", { ascending: false });
  return (data ?? []) as Automation[];
}

export async function fetchAutomation(id: string): Promise<Automation | null> {
  const { data } = await db.from("automations").select("*").eq("id", id).maybeSingle();
  return (data ?? null) as Automation | null;
}

export async function createAutomation(input: Partial<Automation>): Promise<Automation> {
  const { data, error } = await db.from("automations").insert(input).select("*").single();
  if (error) throw error;
  return data as Automation;
}

export async function updateAutomation(id: string, input: Partial<Automation>) {
  const { error } = await db.from("automations").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteAutomation(id: string) {
  const { error } = await db.from("automations").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchLogs(filters?: {
  automationId?: string;
  status?: AutomationLogStatus;
  triggerType?: string;
  since?: string;
  limit?: number;
}): Promise<AutomationLog[]> {
  let q = db.from("automation_logs").select("*").order("created_at", { ascending: false });
  if (filters?.automationId) q = q.eq("automation_id", filters.automationId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.triggerType) q = q.eq("trigger_type", filters.triggerType);
  if (filters?.since) q = q.gte("created_at", filters.since);
  q = q.limit(filters?.limit ?? 200);
  const { data } = await q;
  return (data ?? []) as AutomationLog[];
}

export async function insertTestLog(automation: Automation, status: AutomationLogStatus = "success") {
  const { error } = await db.from("automation_logs").insert({
    automation_id: automation.id,
    trigger_type: automation.trigger_type,
    status,
    details_json: { test: true, preview: buildPreview(automation) },
  });
  if (error) throw error;
}

export async function countLogsByStatus(status: AutomationLogStatus): Promise<number> {
  const { count } = await db.from("automation_logs").select("*", { count: "exact", head: true }).eq("status", status);
  return count ?? 0;
}
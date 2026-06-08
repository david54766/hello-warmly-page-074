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
  { value: "member_joined_platform", label: "Member joined the platform" },
  { value: "member_joined_space", label: "Member joined a Space" },
  { value: "member_completed_onboarding", label: "Member completed onboarding" },
  { value: "member_inactive_placeholder", label: "Member became inactive (placeholder)" },
  { value: "post_created", label: "Post created" },
  { value: "comment_created", label: "Comment created" },
  { value: "reaction_received", label: "Reaction received" },
  { value: "report_created", label: "Report created" },
  { value: "lesson_completed", label: "Lesson completed" },
  { value: "course_completed", label: "Course completed" },
  { value: "event_rsvped", label: "Event RSVP" },
  { value: "subscription_active", label: "Subscription became active" },
  { value: "subscription_past_due", label: "Subscription past due" },
  { value: "subscription_canceled", label: "Subscription canceled" },
  { value: "purchase_completed", label: "Purchase completed" },
  { value: "points_milestone_reached", label: "Points milestone reached" },
  { value: "badge_awarded", label: "Badge awarded" },
];

export const CONDITION_OPTIONS: { value: string; label: string; needsValue?: boolean }[] = [
  { value: "has_role", label: "Member has role", needsValue: true },
  { value: "is_in_space", label: "Member is in Space", needsValue: true },
  { value: "is_not_in_space", label: "Member is not in Space", needsValue: true },
  { value: "is_on_plan", label: "Member is on plan", needsValue: true },
  { value: "is_not_on_plan", label: "Member is not on plan", needsValue: true },
  { value: "subscription_status", label: "Subscription status equals", needsValue: true },
  { value: "has_tag", label: "Member has tag", needsValue: true },
  { value: "not_has_tag", label: "Member does not have tag", needsValue: true },
  { value: "has_badge", label: "Member has badge", needsValue: true },
  { value: "not_has_badge", label: "Member does not have badge", needsValue: true },
  { value: "points_above", label: "Member has more than X points", needsValue: true },
  { value: "points_below", label: "Member has fewer than X points", needsValue: true },
  { value: "completed_lesson", label: "Member completed lesson", needsValue: true },
  { value: "not_completed_lesson", label: "Member has not completed lesson", needsValue: true },
  { value: "completed_course", label: "Member has completed course", needsValue: true },
  { value: "posts_at_least", label: "Member has created at least X posts", needsValue: true },
  { value: "lessons_completed_at_least", label: "Member completed at least X lessons", needsValue: true },
  { value: "inactive_since", label: "Member inactive since date", needsValue: true },
];

export const ACTION_OPTIONS: { value: string; label: string; needsValue?: boolean }[] = [
  { value: "send_notification", label: "Send notification", needsValue: true },
  { value: "add_tag", label: "Add tag", needsValue: true },
  { value: "remove_tag", label: "Remove tag", needsValue: true },
  { value: "award_badge", label: "Award badge", needsValue: true },
  { value: "award_points", label: "Award points", needsValue: true },
  { value: "invite_to_space", label: "Invite to Space", needsValue: true },
  { value: "remove_from_space", label: "Remove from Space", needsValue: true },
  { value: "grant_access", label: "Grant access (type:id)", needsValue: true },
  { value: "revoke_access", label: "Revoke access (type:id)", needsValue: true },
  { value: "notify_admin", label: "Notify admin" },
  { value: "send_private_message", label: "Send private message (placeholder)", needsValue: true },
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

// ---- Phase 4B runner helpers ----

export interface TestResultRow {
  condition?: AutomationCondition;
  action?: AutomationAction;
  passed?: boolean;
  result?: { status: string; message?: string };
}

export interface TestAutomationResult {
  status: AutomationLogStatus;
  all_conditions_passed: boolean;
  conditions: { condition: AutomationCondition; passed: boolean }[];
  actions: { action: AutomationAction; result: { status: string; message?: string } }[];
  error?: string;
}

export async function testAutomation(automationId: string, userId: string): Promise<TestAutomationResult> {
  const { data, error } = await db.rpc("test_automation", { _automation_id: automationId, _user_id: userId });
  if (error) throw error;
  return data as TestAutomationResult;
}

export async function fetchAutomationStats(automationId: string): Promise<{
  success: number; failed: number; skipped: number; lastRunAt: string | null; lastError: string | null;
}> {
  const [s, f, k, last, err] = await Promise.all([
    db.from("automation_logs").select("*", { count: "exact", head: true }).eq("automation_id", automationId).eq("status", "success"),
    db.from("automation_logs").select("*", { count: "exact", head: true }).eq("automation_id", automationId).eq("status", "failed"),
    db.from("automation_logs").select("*", { count: "exact", head: true }).eq("automation_id", automationId).eq("status", "skipped"),
    db.from("automation_logs").select("created_at").eq("automation_id", automationId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("automation_logs").select("error_message,created_at").eq("automation_id", automationId).eq("status", "failed").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return {
    success: s.count ?? 0,
    failed: f.count ?? 0,
    skipped: k.count ?? 0,
    lastRunAt: last.data?.created_at ?? null,
    lastError: err.data?.error_message ?? null,
  };
}

export interface MemberOption { id: string; full_name: string | null; email: string | null; }

export async function searchMembers(query: string, limit = 10): Promise<MemberOption[]> {
  let q = db.from("profiles").select("id, full_name, email").limit(limit);
  if (query && query.trim()) q = q.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
  const { data } = await q;
  return (data ?? []) as MemberOption[];
}

export function automationSafetyWarnings(a: Pick<Automation, "conditions_json" | "actions_json">): string[] {
  const warnings: string[] = [];
  const actions = a.actions_json ?? [];
  if ((a.conditions_json ?? []).length === 0) {
    warnings.push("No conditions set — this will run for every matching event.");
  }
  const accessChanging = actions.filter((x) => ["grant_access", "revoke_access", "remove_from_space", "invite_to_space"].includes(x.type));
  if (accessChanging.length >= 2) warnings.push("Multiple access-changing actions — review carefully.");
  if (actions.some((x) => x.type === "remove_from_space")) warnings.push("Removes members from a Space.");
  if (actions.some((x) => x.type === "revoke_access")) warnings.push("Revokes member access.");
  if (actions.some((x) => x.type === "notify_admin" || x.type === "send_notification") && (a.conditions_json ?? []).length === 0) {
    warnings.push("Broad notification with no conditions — risk of notification spam.");
  }
  return warnings;
}
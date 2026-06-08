import { supabase } from "@/integrations/supabase/client";

export type BillingInterval = "free" | "monthly" | "annual" | "one_time";
export type PlanItemTargetType = "platform" | "space" | "course" | "event" | "resource_placeholder";
export type PlanAccessLevel = "full_access" | "preview_access" | "limited_access";

export const BILLING_INTERVAL_LABELS: Record<BillingInterval, string> = {
  free: "Free",
  monthly: "per month",
  annual: "per year",
  one_time: "one-time",
};

export const TARGET_TYPE_LABELS: Record<PlanItemTargetType, string> = {
  platform: "Entire platform",
  space: "Space",
  course: "Course",
  event: "Event",
  resource_placeholder: "Resource (coming soon)",
};

export const ACCESS_LEVEL_LABELS: Record<PlanAccessLevel, string> = {
  full_access: "Full access",
  preview_access: "Preview access",
  limited_access: "Limited access",
};

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_interval: BillingInterval;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  trial_days: number;
  access_rules_json: Record<string, unknown>;
  featured: boolean;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PlanItem {
  id: string;
  plan_id: string;
  target_type: PlanItemTargetType;
  target_id: string | null;
  access_level: PlanAccessLevel;
  created_at: string;
}

export interface BillingSettings {
  id: string;
  stripe_publishable_key: string | null;
  stripe_secret_key_placeholder: string | null;
  stripe_webhook_secret_placeholder: string | null;
  currency: string;
  tax_behavior: string;
  billing_support_email: string | null;
  updated_at: string;
}

const db = supabase as any;

export function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "USD").toUpperCase(),
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    }).format(price);
  } catch {
    return `$${price}`;
  }
}

export async function fetchActivePlans(): Promise<Plan[]> {
  const { data } = await db.from("plans").select("*").eq("active", true).order("sort_order");
  return (data ?? []) as Plan[];
}

export async function fetchAllPlans(): Promise<Plan[]> {
  const { data } = await db.from("plans").select("*").order("sort_order");
  return (data ?? []) as Plan[];
}

export async function fetchPlan(id: string): Promise<Plan | null> {
  const { data } = await db.from("plans").select("*").eq("id", id).maybeSingle();
  return (data ?? null) as Plan | null;
}

export async function fetchPlanItems(planId: string): Promise<PlanItem[]> {
  const { data } = await db.from("plan_items").select("*").eq("plan_id", planId).order("created_at");
  return (data ?? []) as PlanItem[];
}

export async function fetchAllPlanItems(): Promise<PlanItem[]> {
  const { data } = await db.from("plan_items").select("*");
  return (data ?? []) as PlanItem[];
}

export async function createPlan(input: Partial<Plan>) {
  const { data, error } = await db.from("plans").insert(input).select("*").single();
  if (error) throw error;
  return data as Plan;
}

export async function updatePlan(id: string, input: Partial<Plan>) {
  const { error } = await db.from("plans").update(input).eq("id", id);
  if (error) throw error;
}

export async function deletePlan(id: string) {
  const { error } = await db.from("plans").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderPlan(id: string, sort_order: number) {
  await updatePlan(id, { sort_order });
}

export async function addPlanItem(input: Omit<PlanItem, "id" | "created_at">) {
  const { error } = await db.from("plan_items").insert(input);
  if (error) throw error;
}

export async function deletePlanItem(id: string) {
  const { error } = await db.from("plan_items").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchBillingSettings(): Promise<BillingSettings | null> {
  const { data } = await db.from("billing_settings").select("*").order("created_at").limit(1).maybeSingle();
  return (data ?? null) as BillingSettings | null;
}

export async function fetchBillingSettingsPublic(): Promise<Pick<BillingSettings, "id" | "stripe_publishable_key" | "currency" | "tax_behavior" | "billing_support_email" | "updated_at"> | null> {
  const { data } = await db.from("billing_settings_public").select("*").limit(1).maybeSingle();
  return data ?? null;
}

export async function updateBillingSettings(id: string, input: Partial<BillingSettings>) {
  const { error } = await db.from("billing_settings").update(input).eq("id", id);
  if (error) throw error;
}

export async function createBillingSettings(input: Partial<BillingSettings>) {
  const { data, error } = await db.from("billing_settings").insert(input).select("*").single();
  if (error) throw error;
  return data as BillingSettings;
}

/** Placeholder — checkout not yet implemented in this phase. */
export function isCheckoutEnabled(): boolean {
  return false;
}

export function maskSecret(value: string | null | undefined): string {
  if (!value) return "";
  if (value.length <= 8) return "•".repeat(value.length);
  return `${value.slice(0, 4)}${"•".repeat(Math.max(value.length - 8, 4))}${value.slice(-4)}`;
}
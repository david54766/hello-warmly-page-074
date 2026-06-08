import { supabase } from "@/integrations/supabase/client";
import type { PlanItemTargetType, PlanAccessLevel } from "@/lib/plans";

const db = supabase as any;

export type AccessTargetType = PlanItemTargetType; // platform | space | course | event | resource_placeholder
export type AccessSource = "free" | "plan" | "purchase" | "bundle" | "manual" | "admin_override";
export type AccessState = "free" | "preview" | "paid" | "paid_placeholder" | "hidden";

export const ACCESS_SOURCE_LABELS: Record<AccessSource, string> = {
  free: "Free", plan: "Plan", purchase: "Purchase", bundle: "Bundle",
  manual: "Manual grant", admin_override: "Admin override",
};

export const ACCESS_STATE_LABELS: Record<AccessState, string> = {
  free: "Free", preview: "Preview", paid: "Paid", paid_placeholder: "Paid", hidden: "Hidden",
};

export function isPaidAccessLevel(level: string | null | undefined): boolean {
  return level === "paid" || level === "paid_placeholder";
}

export interface AccessGrant {
  id: string;
  user_id: string;
  target_type: AccessTargetType;
  target_id: string | null;
  access_source: AccessSource;
  source_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Bundle {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  active: boolean;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BundleItem {
  id: string;
  bundle_id: string;
  target_type: AccessTargetType;
  target_id: string | null;
  access_level: PlanAccessLevel;
  created_at: string;
}

/** RPC wrapper — true when the user has paid/granted access to the target. */
export async function hasAccess(
  userId: string | null | undefined,
  targetType: AccessTargetType,
  targetId: string,
): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await db.rpc("has_access", {
    _user_id: userId, _target_type: targetType, _target_id: targetId,
  });
  if (error) return false;
  return !!data;
}

// -------- Access grants --------
export async function fetchMyGrants(userId: string): Promise<AccessGrant[]> {
  const { data } = await db.from("access_grants").select("*").eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as AccessGrant[];
}

export async function fetchAllGrants(): Promise<AccessGrant[]> {
  const { data } = await db.from("access_grants").select("*").order("created_at", { ascending: false });
  return (data ?? []) as AccessGrant[];
}

export async function fetchGrantsForUser(userId: string): Promise<AccessGrant[]> {
  return fetchMyGrants(userId);
}

export async function createGrant(input: Partial<AccessGrant>): Promise<AccessGrant> {
  const { data, error } = await db.from("access_grants").insert({
    access_source: "manual",
    active: true,
    ...input,
  }).select("*").single();
  if (error) throw error;
  return data as AccessGrant;
}

export async function revokeGrant(id: string) {
  const { error } = await db.from("access_grants").update({ active: false }).eq("id", id);
  if (error) throw error;
}

export async function deleteGrant(id: string) {
  const { error } = await db.from("access_grants").delete().eq("id", id);
  if (error) throw error;
}

// -------- Bundles --------
export async function fetchActiveBundles(): Promise<Bundle[]> {
  const { data } = await db.from("bundles").select("*").eq("active", true).order("sort_order");
  return (data ?? []) as Bundle[];
}

export async function fetchAllBundles(): Promise<Bundle[]> {
  const { data } = await db.from("bundles").select("*").order("sort_order");
  return (data ?? []) as Bundle[];
}

export async function fetchBundle(id: string): Promise<Bundle | null> {
  const { data } = await db.from("bundles").select("*").eq("id", id).maybeSingle();
  return (data ?? null) as Bundle | null;
}

export async function createBundle(input: Partial<Bundle>): Promise<Bundle> {
  const { data, error } = await db.from("bundles").insert(input).select("*").single();
  if (error) throw error;
  return data as Bundle;
}

export async function updateBundle(id: string, input: Partial<Bundle>) {
  const { error } = await db.from("bundles").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteBundle(id: string) {
  const { error } = await db.from("bundles").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchBundleItems(bundleId?: string): Promise<BundleItem[]> {
  let q = db.from("bundle_items").select("*").order("created_at");
  if (bundleId) q = q.eq("bundle_id", bundleId);
  const { data } = await q;
  return (data ?? []) as BundleItem[];
}

export async function addBundleItem(input: Omit<BundleItem, "id" | "created_at">) {
  const { error } = await db.from("bundle_items").insert(input);
  if (error) throw error;
}

export async function removeBundleItem(id: string) {
  const { error } = await db.from("bundle_items").delete().eq("id", id);
  if (error) throw error;
}
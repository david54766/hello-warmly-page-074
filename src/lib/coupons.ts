import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type CouponDiscountType = "percent" | "fixed_amount";
export type CouponAppliesToType = "all" | "plan" | "bundle" | "course" | "event" | "space";

export const COUPON_TARGET_LABELS: Record<CouponAppliesToType, string> = {
  all: "All purchases",
  plan: "Specific plan",
  bundle: "Specific bundle",
  course: "Specific course",
  event: "Specific event",
  space: "Specific Space",
};

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: CouponDiscountType;
  discount_value: number;
  applies_to_type: CouponAppliesToType;
  applies_to_id: string | null;
  max_uses: number | null;
  times_used: number;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponRedemption {
  id: string;
  coupon_id: string;
  user_id: string;
  checkout_session_id: string | null;
  purchase_id: string | null;
  subscription_id: string | null;
  amount_discounted: number;
  redeemed_at: string;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  coupon_id?: string;
  code?: string;
  discount_type?: CouponDiscountType;
  discount_value?: number;
  discount_amount?: number;
}

export const VALIDATION_REASON_LABELS: Record<string, string> = {
  not_found: "Coupon code not found",
  inactive: "This coupon is no longer active",
  not_started: "This coupon isn't active yet",
  expired: "This coupon has expired",
  maxed_out: "This coupon has reached its maximum uses",
  wrong_target: "This coupon doesn't apply to this item",
};

export function formatDiscount(c: Pick<Coupon, "discount_type" | "discount_value">) {
  return c.discount_type === "percent" ? `${c.discount_value}% off` : `$${c.discount_value} off`;
}

export function isCouponExpired(c: Coupon) {
  return c.expires_at ? new Date(c.expires_at) <= new Date() : false;
}

export function isCouponMaxed(c: Coupon) {
  return c.max_uses !== null && c.times_used >= c.max_uses;
}

export async function fetchAllCoupons(): Promise<Coupon[]> {
  const { data } = await db.from("coupons").select("*").order("created_at", { ascending: false });
  return (data ?? []) as Coupon[];
}

export async function fetchCoupon(id: string): Promise<Coupon | null> {
  const { data } = await db.from("coupons").select("*").eq("id", id).maybeSingle();
  return (data ?? null) as Coupon | null;
}

export async function createCoupon(input: Partial<Coupon>) {
  const { data, error } = await db.from("coupons").insert({ ...input, code: (input.code || "").toUpperCase() }).select("*").single();
  if (error) throw error;
  return data as Coupon;
}

export async function updateCoupon(id: string, input: Partial<Coupon>) {
  if (input.code) input = { ...input, code: input.code.toUpperCase() };
  const { error } = await db.from("coupons").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteCoupon(id: string) {
  const { error } = await db.from("coupons").delete().eq("id", id);
  if (error) throw error;
}

export async function validateCoupon(
  code: string,
  appliesToType: CouponAppliesToType = "all",
  appliesToId: string | null = null,
  amount = 0,
): Promise<ValidationResult> {
  const { data, error } = await db.rpc("validate_coupon", {
    _code: code.trim(),
    _applies_to_type: appliesToType,
    _applies_to_id: appliesToId,
    _amount: amount,
  });
  if (error) return { valid: false, reason: "not_found" };
  return (data ?? { valid: false }) as ValidationResult;
}

export async function fetchRedemptions(couponId?: string): Promise<CouponRedemption[]> {
  let q = db.from("coupon_redemptions").select("*").order("redeemed_at", { ascending: false });
  if (couponId) q = q.eq("coupon_id", couponId);
  const { data } = await q;
  return (data ?? []) as CouponRedemption[];
}

export async function recordRedemption(input: Partial<CouponRedemption>) {
  const { error } = await db.from("coupon_redemptions").insert(input);
  if (error) throw error;
}
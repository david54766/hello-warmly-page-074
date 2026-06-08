import { supabase } from "@/integrations/supabase/client";
import type { Plan } from "@/lib/plans";

const db = supabase as any;

export type SubscriptionStatus =
  | "active" | "trialing" | "past_due" | "canceled"
  | "incomplete" | "incomplete_expired" | "unpaid" | "paused";

export type PurchaseStatus = "pending" | "paid" | "failed" | "refunded" | "canceled";
export type CheckoutSessionStatus = "created" | "pending" | "completed" | "expired" | "failed";
export type InvoiceStatus = "draft" | "open" | "paid" | "uncollectible" | "void";
export type PurchaseKind = "subscription" | "one_time";

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  purchase_type: PurchaseKind;
  target_type: string | null;
  target_id: string | null;
  plan_id: string | null;
  amount: number;
  currency: string;
  stripe_payment_intent_id: string | null;
  status: PurchaseStatus;
  created_at: string;
  updated_at: string;
}

export interface CheckoutSession {
  id: string;
  user_id: string;
  plan_id: string | null;
  target_type: string | null;
  target_id: string | null;
  stripe_session_id: string | null;
  status: CheckoutSessionStatus;
  checkout_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  subscription_id: string | null;
  stripe_invoice_id: string | null;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: InvoiceStatus;
  hosted_invoice_url: string | null;
  invoice_pdf_url: string | null;
  created_at: string;
}

export interface PaymentWebhookEvent {
  id: string;
  stripe_event_id: string | null;
  event_type: string;
  payload_json: Record<string, unknown>;
  processed: boolean;
  processing_error: string | null;
  created_at: string;
  processed_at: string | null;
}

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "Active", trialing: "Trialing", past_due: "Past due", canceled: "Canceled",
  incomplete: "Incomplete", incomplete_expired: "Incomplete (expired)", unpaid: "Unpaid", paused: "Paused",
};

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  pending: "Pending", paid: "Paid", failed: "Failed", refunded: "Refunded", canceled: "Canceled",
};

export const CHECKOUT_STATUS_LABELS: Record<CheckoutSessionStatus, string> = {
  created: "Created", pending: "Pending", completed: "Completed", expired: "Expired", failed: "Failed",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft", open: "Open", paid: "Paid", uncollectible: "Uncollectible", void: "Void",
};

export async function fetchMySubscription(userId: string): Promise<Subscription | null> {
  const { data } = await db.from("subscriptions").select("*").eq("user_id", userId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  return (data ?? null) as Subscription | null;
}

export async function fetchMyPurchases(userId: string): Promise<Purchase[]> {
  const { data } = await db.from("purchases").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return (data ?? []) as Purchase[];
}

export async function fetchMyInvoices(userId: string): Promise<Invoice[]> {
  const { data } = await db.from("invoices").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return (data ?? []) as Invoice[];
}

export async function fetchAllSubscriptions(): Promise<Subscription[]> {
  const { data } = await db.from("subscriptions").select("*").order("created_at", { ascending: false });
  return (data ?? []) as Subscription[];
}

export async function fetchAllPurchases(): Promise<Purchase[]> {
  const { data } = await db.from("purchases").select("*").order("created_at", { ascending: false });
  return (data ?? []) as Purchase[];
}

export async function fetchAllCheckoutSessions(): Promise<CheckoutSession[]> {
  const { data } = await db.from("checkout_sessions").select("*").order("created_at", { ascending: false });
  return (data ?? []) as CheckoutSession[];
}

export async function fetchAllInvoices(): Promise<Invoice[]> {
  const { data } = await db.from("invoices").select("*").order("created_at", { ascending: false });
  return (data ?? []) as Invoice[];
}

export async function fetchAllWebhookEvents(): Promise<PaymentWebhookEvent[]> {
  const { data } = await db.from("payment_webhook_events").select("*").order("created_at", { ascending: false }).limit(200);
  return (data ?? []) as PaymentWebhookEvent[];
}

export async function isStripeConfigured(): Promise<boolean> {
  const { data } = await db.from("billing_settings_public").select("stripe_publishable_key").limit(1).maybeSingle();
  return !!data?.stripe_publishable_key;
}

/**
 * Start a checkout for a given plan. In this phase, this records a
 * checkout_sessions row and returns whether Stripe is wired up. The
 * actual Stripe Checkout session creation happens server-side in a
 * later phase (requires STRIPE_SECRET_KEY).
 */
export async function startCheckout(plan: Plan, userId: string): Promise<{
  configured: boolean;
  checkoutSessionId: string;
  redirectUrl: string | null;
}> {
  const configured = await isStripeConfigured();
  const { data, error } = await db.from("checkout_sessions").insert({
    user_id: userId,
    plan_id: plan.id,
    status: configured ? "pending" : "created",
  }).select("id").single();
  if (error) throw error;
  return {
    configured,
    checkoutSessionId: data.id,
    redirectUrl: null, // populated by Stripe in a later phase
  };
}

export function ctaForPlan(plan: Plan, configured: boolean, isAdmin: boolean) {
  const isFree = plan.billing_interval === "free" || Number(plan.price) === 0;
  if (isFree) return "Start Free";
  if (!configured) return isAdmin ? "Setup Required" : "Coming Soon";
  if (plan.billing_interval === "one_time") return "Buy Now";
  return "Upgrade";
}
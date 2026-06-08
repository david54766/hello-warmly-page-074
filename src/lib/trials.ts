import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type TrialStatus = "active" | "converted" | "expired" | "canceled";

export const TRIAL_STATUS_LABELS: Record<TrialStatus, string> = {
  active: "Active", converted: "Converted", expired: "Expired", canceled: "Canceled",
};

export interface TrialRecord {
  id: string;
  user_id: string;
  plan_id: string | null;
  status: TrialStatus;
  starts_at: string;
  ends_at: string;
  converted_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export function isTrialActive(t: TrialRecord) {
  return t.status === "active" && new Date(t.ends_at) > new Date();
}

export function daysRemaining(t: TrialRecord) {
  const ms = new Date(t.ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400_000));
}

export async function fetchActiveTrial(userId: string): Promise<TrialRecord | null> {
  const { data } = await db.from("trial_records").select("*")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return (data ?? null) as TrialRecord | null;
}

export async function fetchMyTrials(userId: string): Promise<TrialRecord[]> {
  const { data } = await db.from("trial_records").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return (data ?? []) as TrialRecord[];
}

export async function fetchAllTrials(): Promise<TrialRecord[]> {
  const { data } = await db.from("trial_records").select("*").order("created_at", { ascending: false });
  return (data ?? []) as TrialRecord[];
}

export async function startTrial(userId: string, planId: string, trialDays: number) {
  const ends = new Date(Date.now() + trialDays * 86400_000).toISOString();
  const { data, error } = await db.from("trial_records").insert({
    user_id: userId, plan_id: planId, status: "active", ends_at: ends,
  }).select("*").single();
  if (error) throw error;
  return data as TrialRecord;
}

export async function cancelTrial(id: string) {
  const { error } = await db.from("trial_records").update({
    status: "canceled", canceled_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
}

export async function convertTrial(id: string) {
  const { error } = await db.from("trial_records").update({
    status: "converted", converted_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
}
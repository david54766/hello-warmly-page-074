import { supabase } from "@/integrations/supabase/client";
import { getPublicSiteUrl } from "@/lib/site-url";

const db: any = supabase;

export type InvitationStatus = "pending" | "accepted" | "expired" | "canceled";
export type AppRole = "platform_admin" | "moderator" | "member";

export interface Invitation {
  id: string;
  email: string;
  role: AppRole;
  space_id: string | null;
  invited_by: string | null;
  token: string;
  status: InvitationStatus;
  expires_at: string | null;
  accepted_by: string | null;
  accepted_at: string | null;
  personal_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface InviteLink {
  id: string;
  name: string;
  token: string;
  role: AppRole;
  space_id: string | null;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchInvitations(): Promise<Invitation[]> {
  const { data } = await db.from("invitations").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function createInvitation(input: {
  email: string; role: AppRole; space_id?: string | null; expires_at?: string | null; personal_message?: string | null;
}, invitedBy: string): Promise<Invitation> {
  const payload = {
    email: input.email.trim().toLowerCase(),
    role: input.role,
    space_id: input.space_id ?? null,
    expires_at: input.expires_at ?? null,
    personal_message: input.personal_message ?? null,
    invited_by: invitedBy,
  };
  const { data, error } = await db.from("invitations").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function cancelInvitation(id: string) {
  await db.from("invitations").update({ status: "canceled" }).eq("id", id);
}

export async function fetchInviteLinks(): Promise<InviteLink[]> {
  const { data } = await db.from("invite_links").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function createInviteLink(input: {
  name: string; role: AppRole; space_id?: string | null; max_uses?: number | null; expires_at?: string | null;
}, createdBy: string): Promise<InviteLink> {
  const { data, error } = await db.from("invite_links").insert({
    name: input.name, role: input.role, space_id: input.space_id ?? null,
    max_uses: input.max_uses ?? null, expires_at: input.expires_at ?? null, created_by: createdBy,
  }).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateInviteLink(id: string, patch: Partial<InviteLink>) {
  await db.from("invite_links").update(patch).eq("id", id);
}

export async function deleteInviteLink(id: string) {
  await db.from("invite_links").delete().eq("id", id);
}

export async function lookupToken(token: string): Promise<{ kind: "invitation" | "invite_link" | "none"; data: any }> {
  const { data: invRes } = await db.rpc("lookup_invitation_by_token", { _token: token });
  if (invRes?.found) return { kind: "invitation", data: invRes };
  const { data: linkRes } = await db.rpc("lookup_invite_link_by_token", { _token: token });
  if (linkRes?.found) return { kind: "invite_link", data: linkRes };
  return { kind: "none", data: null };
}

export async function acceptInvitationToken(token: string) {
  const { data, error } = await db.rpc("accept_invitation", { _token: token });
  if (error) throw error;
  return data;
}

export async function acceptInviteLinkToken(token: string) {
  const { data, error } = await db.rpc("accept_invite_link", { _token: token });
  if (error) throw error;
  return data;
}

export function buildInviteUrl(token: string) {
  return `${getPublicSiteUrl()}/invite/${token}`;
}
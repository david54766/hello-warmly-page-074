import { supabase } from "@/integrations/supabase/client";

export type ConversationType = "direct" | "group" | "space";
export type MessageStatus = "active" | "deleted" | "hidden";
export type MessageReactionType = "like" | "love" | "celebrate" | "helpful";

const sb = supabase as any;

export interface Conversation {
  id: string;
  type: ConversationType;
  space_id: string | null;
  title: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string | null;
  muted: boolean;
  archived: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  media_urls: string[];
  status: MessageStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction_type: MessageReactionType;
  created_at: string;
}

export interface ProfileLite {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface ConversationSummary {
  conversation: Conversation;
  members: ProfileLite[];
  lastMessage: Message | null;
  unreadCount: number;
  lastReadAt: string | null;
  muted: boolean;
  spaceName?: string | null;
}

export const REACTION_EMOJI: Record<MessageReactionType, string> = {
  like: "👍",
  love: "❤️",
  celebrate: "🎉",
  helpful: "💡",
};

export async function listMyConversations(userId: string): Promise<ConversationSummary[]> {
  // Direct + group: my memberships
  const { data: myMems } = await sb
    .from("conversation_members")
    .select("conversation_id,last_read_at,muted,archived")
    .eq("user_id", userId);
  const memMap = new Map<string, { last_read_at: string | null; muted: boolean }>();
  (myMems ?? []).forEach((m: any) => memMap.set(m.conversation_id, { last_read_at: m.last_read_at, muted: m.muted }));
  const convIds = Array.from(memMap.keys());

  // Space conversations from my space memberships
  const { data: spaceMems } = await supabase
    .from("space_members")
    .select("space_id")
    .eq("user_id", userId)
    .eq("status", "active");
  const spaceIds = (spaceMems ?? []).map((s: any) => s.space_id);
  let spaceConvs: Conversation[] = [];
  if (spaceIds.length) {
    const { data } = await sb
      .from("conversations")
      .select("*")
      .eq("type", "space")
      .in("space_id", spaceIds);
    spaceConvs = (data ?? []) as Conversation[];
  }

  let directConvs: Conversation[] = [];
  if (convIds.length) {
    const { data } = await sb.from("conversations").select("*").in("id", convIds);
    directConvs = (data ?? []) as Conversation[];
  }

  const all = [...directConvs, ...spaceConvs];
  if (all.length === 0) return [];

  const allIds = all.map((c) => c.id);

  // Members of all conversations (for direct/group display names + avatars)
  const { data: allMems } = await sb
    .from("conversation_members")
    .select("conversation_id,user_id")
    .in("conversation_id", allIds);
  const membersByConv = new Map<string, string[]>();
  (allMems ?? []).forEach((m: any) => {
    const arr = membersByConv.get(m.conversation_id) ?? [];
    arr.push(m.user_id);
    membersByConv.set(m.conversation_id, arr);
  });

  const userIds = Array.from(new Set((allMems ?? []).map((m: any) => m.user_id as string))) as string[];
  const profilesByUser = new Map<string, ProfileLite>();
  if (userIds.length) {
    const { data: profs } = await supabase.from("profiles").select("id,full_name,email,avatar_url").in("id", userIds);
    (profs ?? []).forEach((p: any) => profilesByUser.set(p.id, p));
  }

  // Space names
  const spaceNameById = new Map<string, string>();
  const sids = all.filter((c) => c.space_id).map((c) => c.space_id!) as string[];
  if (sids.length) {
    const { data: sps } = await supabase.from("spaces").select("id,name").in("id", sids);
    (sps ?? []).forEach((s: any) => spaceNameById.set(s.id, s.name));
  }

  // Last message per conversation
  const { data: msgs } = await sb
    .from("messages")
    .select("*")
    .in("conversation_id", allIds)
    .order("created_at", { ascending: false })
    .limit(500);
  const lastByConv = new Map<string, Message>();
  (msgs ?? []).forEach((m: any) => {
    if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m as Message);
  });

  // Unread counts
  const unreadByConv = new Map<string, number>();
  (msgs ?? []).forEach((m: any) => {
    const meta = memMap.get(m.conversation_id);
    const lastRead = meta?.last_read_at ?? null;
    if (m.sender_id === userId) return;
    if (!lastRead || new Date(m.created_at) > new Date(lastRead)) {
      unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) ?? 0) + 1);
    }
  });

  const summaries: ConversationSummary[] = all.map((c) => {
    const uids = (membersByConv.get(c.id) ?? []).filter((u) => u !== userId);
    const members = uids.map((u) => profilesByUser.get(u)).filter(Boolean) as ProfileLite[];
    const meta = memMap.get(c.id);
    return {
      conversation: c,
      members,
      lastMessage: lastByConv.get(c.id) ?? null,
      unreadCount: unreadByConv.get(c.id) ?? 0,
      lastReadAt: meta?.last_read_at ?? null,
      muted: meta?.muted ?? false,
      spaceName: c.space_id ? spaceNameById.get(c.space_id) ?? null : null,
    };
  });

  summaries.sort((a, b) => {
    const ad = a.lastMessage?.created_at ?? a.conversation.updated_at;
    const bd = b.lastMessage?.created_at ?? b.conversation.updated_at;
    return new Date(bd).getTime() - new Date(ad).getTime();
  });
  return summaries;
}

export async function totalUnread(userId: string): Promise<number> {
  const list = await listMyConversations(userId);
  return list.reduce((a, c) => a + c.unreadCount, 0);
}

/** Find or create a direct conversation between current user and other user. */
export async function getOrCreateDirect(currentUserId: string, otherUserId: string): Promise<string> {
  if (currentUserId === otherUserId) throw new Error("Cannot message yourself");
  // Find existing
  const { data: mine } = await sb
    .from("conversation_members")
    .select("conversation_id, conversations!inner(type)")
    .eq("user_id", currentUserId);
  const myDirectIds = (mine ?? [])
    .filter((r: any) => r.conversations?.type === "direct")
    .map((r: any) => r.conversation_id);
  if (myDirectIds.length) {
    const { data: others } = await sb
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", myDirectIds);
    const match = (others ?? [])[0];
    if (match) return match.conversation_id;
  }
  // Create
  const { data: conv, error } = await sb
    .from("conversations")
    .insert({ type: "direct", created_by: currentUserId })
    .select()
    .single();
  if (error) throw error;
  const { error: mErr } = await sb.from("conversation_members").insert([
    { conversation_id: conv.id, user_id: currentUserId },
    { conversation_id: conv.id, user_id: otherUserId },
  ]);
  if (mErr) throw mErr;
  return conv.id as string;
}

export async function createGroup(currentUserId: string, userIds: string[], title?: string): Promise<string> {
  const unique = Array.from(new Set([currentUserId, ...userIds]));
  if (unique.length < 2) throw new Error("Select at least one member");
  const { data: conv, error } = await sb
    .from("conversations")
    .insert({ type: "group", created_by: currentUserId, title: title?.trim() || null })
    .select()
    .single();
  if (error) throw error;
  const rows = unique.map((u) => ({ conversation_id: conv.id, user_id: u }));
  const { error: mErr } = await sb.from("conversation_members").insert(rows);
  if (mErr) throw mErr;
  return conv.id as string;
}

/** Find or create the conversation tied to a Space. */
export async function getOrCreateSpaceConversation(spaceId: string, currentUserId: string): Promise<string> {
  const { data: existing } = await sb
    .from("conversations")
    .select("id")
    .eq("space_id", spaceId)
    .eq("type", "space")
    .maybeSingle();
  if (existing) return existing.id as string;
  const { data: conv, error } = await sb
    .from("conversations")
    .insert({ type: "space", space_id: spaceId, created_by: currentUserId })
    .select()
    .single();
  if (error) throw error;
  return conv.id as string;
}

export async function fetchMessages(conversationId: string, limit = 200): Promise<Message[]> {
  const { data, error } = await sb
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function fetchReactions(messageIds: string[]): Promise<MessageReaction[]> {
  if (!messageIds.length) return [];
  const { data } = await sb.from("message_reactions").select("*").in("message_id", messageIds);
  return (data ?? []) as MessageReaction[];
}

export async function sendMessage(conversationId: string, senderId: string, body: string, media: string[] = []): Promise<Message> {
  if (!body.trim() && media.length === 0) throw new Error("Message is empty");
  const { data, error } = await sb
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body: body.trim(), media_urls: media })
    .select()
    .single();
  if (error) throw error;
  return data as Message;
}

export async function softDeleteMessage(messageId: string) {
  const { error } = await sb
    .from("messages")
    .update({ status: "deleted", deleted_at: new Date().toISOString(), body: "" })
    .eq("id", messageId);
  if (error) throw error;
}

export async function hideMessage(messageId: string) {
  const { error } = await sb.from("messages").update({ status: "hidden" }).eq("id", messageId);
  if (error) throw error;
}

export async function restoreMessage(messageId: string) {
  const { error } = await sb.from("messages").update({ status: "active" }).eq("id", messageId);
  if (error) throw error;
}

export async function toggleReaction(messageId: string, userId: string, type: MessageReactionType) {
  const { data: existing } = await sb
    .from("message_reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .eq("reaction_type", type)
    .maybeSingle();
  if (existing) {
    await sb.from("message_reactions").delete().eq("id", existing.id);
  } else {
    await sb.from("message_reactions").insert({ message_id: messageId, user_id: userId, reaction_type: type });
  }
}

export async function markRead(conversationId: string, userId: string) {
  // Upsert membership row (e.g., for space chat first read) then set last_read_at
  await sb.from("conversation_members").upsert(
    { conversation_id: conversationId, user_id: userId, last_read_at: new Date().toISOString() },
    { onConflict: "conversation_id,user_id" },
  );
}

export async function reportMessage(messageId: string, reporterId: string, reason: string) {
  const { error } = await sb
    .from("reports")
    .insert({ reporter_id: reporterId, target_type: "message", target_id: messageId, reason });
  if (error) throw error;
}

export function conversationDisplayName(s: ConversationSummary, fallback = "Conversation"): string {
  if (s.conversation.type === "space") return s.spaceName ? `# ${s.spaceName}` : "Space chat";
  if (s.conversation.title) return s.conversation.title;
  if (s.members.length === 0) return fallback;
  if (s.members.length === 1) return s.members[0].full_name || s.members[0].email || "Member";
  return s.members
    .slice(0, 3)
    .map((m) => (m.full_name || m.email || "Member").split(" ")[0])
    .join(", ") + (s.members.length > 3 ? ` +${s.members.length - 3}` : "");
}

export function initials(name: string | null | undefined, email: string | null | undefined) {
  const src = (name || email || "?").trim();
  return src
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function timeShort(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d`;
  return d.toLocaleDateString();
}
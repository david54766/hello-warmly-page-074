import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type AIProvider = "openai" | "mock";
export type AIModel = "gpt-4.1" | "gpt-4.1-mini" | "gpt-4o" | "mock-model";

export const AI_PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "mock", label: "Mock (no API key)" },
];
export const AI_MODELS: { value: AIModel; label: string }[] = [
  { value: "gpt-4.1", label: "gpt-4.1" },
  { value: "gpt-4.1-mini", label: "gpt-4.1-mini" },
  { value: "gpt-4o", label: "gpt-4o" },
  { value: "mock-model", label: "mock-model" },
];

export interface AISettings {
  id: string;
  provider: AIProvider;
  model: AIModel;
  api_key_placeholder: string | null;
  temperature: number;
  max_tokens: number;
  ai_enabled: boolean;
  mock_mode_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  context_type: string;
  context_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

export type AIContentType =
  | "post"
  | "announcement"
  | "event_description"
  | "course_announcement"
  | "discussion_prompt"
  | "checklist_idea"
  | "space_idea"
  | "engagement_plan"
  | "summary";
export type AIDraftStatus = "draft" | "published" | "archived";

export const CONTENT_TYPE_LABELS: Record<AIContentType, string> = {
  post: "Post",
  announcement: "Announcement",
  event_description: "Event description",
  course_announcement: "Course announcement",
  discussion_prompt: "Discussion prompt",
  checklist_idea: "Checklist idea",
  space_idea: "Space idea",
  engagement_plan: "Engagement plan",
  summary: "Summary",
};

export interface AIGeneratedContent {
  id: string;
  user_id: string;
  content_type: AIContentType;
  title: string;
  body: string;
  status: AIDraftStatus;
  target_type: string | null;
  target_id: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ---------- Settings ----------
export async function getAISettings(): Promise<AISettings | null> {
  const { data } = await db.from("ai_settings").select("*").order("created_at").limit(1).maybeSingle();
  return (data as AISettings) ?? null;
}

export async function upsertAISettings(patch: Partial<AISettings>): Promise<AISettings> {
  const current = await getAISettings();
  if (!current) {
    const { data, error } = await db.from("ai_settings").insert(patch).select().single();
    if (error) throw error;
    return data as AISettings;
  }
  const { data, error } = await db.from("ai_settings").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", current.id).select().single();
  if (error) throw error;
  return data as AISettings;
}

export function isMockMode(s: AISettings | null): boolean {
  if (!s) return true;
  if (!s.ai_enabled) return true;
  if (s.mock_mode_enabled) return true;
  if (s.provider === "mock") return true;
  return !s.api_key_placeholder;
}

// ---------- Conversations ----------
export async function listConversations(): Promise<AIConversation[]> {
  const { data } = await db.from("ai_conversations").select("*").order("updated_at", { ascending: false });
  return (data ?? []) as AIConversation[];
}
export async function createConversation(title = "New conversation"): Promise<AIConversation> {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await db.from("ai_conversations").insert({ user_id: u.user?.id, title }).select().single();
  if (error) throw error;
  return data as AIConversation;
}
export async function renameConversation(id: string, title: string) {
  await db.from("ai_conversations").update({ title, updated_at: new Date().toISOString() }).eq("id", id);
}
export async function deleteConversation(id: string) {
  await db.from("ai_conversations").delete().eq("id", id);
}
export async function listMessages(conversationId: string): Promise<AIMessage[]> {
  const { data } = await db.from("ai_messages").select("*").eq("conversation_id", conversationId).order("created_at");
  return (data ?? []) as AIMessage[];
}
export async function addMessage(conversationId: string, role: "user" | "assistant" | "system", content: string, metadata: Record<string, unknown> = {}): Promise<AIMessage> {
  const { data, error } = await db.from("ai_messages").insert({ conversation_id: conversationId, role, content, metadata_json: metadata }).select().single();
  if (error) throw error;
  await db.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
  return data as AIMessage;
}

// ---------- Drafts ----------
export async function listDrafts(): Promise<AIGeneratedContent[]> {
  const { data } = await db.from("ai_generated_content").select("*").order("created_at", { ascending: false });
  return (data ?? []) as AIGeneratedContent[];
}
export async function getDraft(id: string): Promise<AIGeneratedContent | null> {
  const { data } = await db.from("ai_generated_content").select("*").eq("id", id).maybeSingle();
  return (data as AIGeneratedContent) ?? null;
}
export async function saveDraft(input: { title: string; body: string; content_type?: AIContentType; metadata?: Record<string, unknown> }): Promise<AIGeneratedContent> {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await db.from("ai_generated_content").insert({
    user_id: u.user?.id,
    title: input.title,
    body: input.body,
    content_type: input.content_type ?? "post",
    status: "draft",
    metadata_json: input.metadata ?? {},
  }).select().single();
  if (error) throw error;
  await logUsage("draft_saved");
  return data as AIGeneratedContent;
}
export async function updateDraft(id: string, patch: Partial<AIGeneratedContent>) {
  const { error } = await db.from("ai_generated_content").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
export async function archiveDraft(id: string) {
  await updateDraft(id, { status: "archived" });
}
export async function deleteDraft(id: string) {
  await db.from("ai_generated_content").delete().eq("id", id);
}

/** Publish a draft as a post in the given space. */
export async function publishDraftAsPost(draftId: string, spaceId: string, title: string, body: string): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  const { data: post, error: pErr } = await db.from("posts").insert({
    space_id: spaceId,
    author_id: u.user?.id,
    post_type: "article",
    title,
    body,
    visibility: "space_members",
    status: "active",
  }).select("id").single();
  if (pErr) throw pErr;
  await db.from("ai_generated_content").update({
    status: "published",
    target_type: "post",
    target_id: post.id,
    updated_at: new Date().toISOString(),
  }).eq("id", draftId);
  // Audit log (best effort)
  try {
    await db.rpc("log_audit", {
      _action: "ai_draft_published",
      _target_type: "post",
      _target_id: post.id,
      _metadata: { draft_id: draftId },
    });
  } catch { /* audit optional */ }
  await logUsage("draft_published");
  return post.id as string;
}

// ---------- Usage ----------
export type AIUsageFeature = "assistant_chat" | "suggested_action" | "draft_saved" | "draft_published" | "mock_response";
export async function logUsage(feature: AIUsageFeature, status: "ok" | "error" = "ok") {
  const { data: u } = await supabase.auth.getUser();
  await db.from("ai_usage_events").insert({ user_id: u.user?.id, feature_type: feature, status });
}
export async function countUsage(): Promise<{ total: number; chat: number; drafts: number }> {
  const [{ count: total }, { count: chat }, { count: drafts }] = await Promise.all([
    db.from("ai_usage_events").select("*", { count: "exact", head: true }),
    db.from("ai_usage_events").select("*", { count: "exact", head: true }).eq("feature_type", "assistant_chat"),
    db.from("ai_usage_events").select("*", { count: "exact", head: true }).in("feature_type", ["draft_saved", "draft_published"]),
  ]);
  return { total: total ?? 0, chat: chat ?? 0, drafts: drafts ?? 0 };
}

// ---------- Suggested actions & mock responses ----------
export interface SuggestedAction {
  id: string;
  title: string;
  description: string;
  contentType: AIContentType;
  prompt: string;
}

export const SUGGESTED_ACTIONS: SuggestedAction[] = [
  { id: "welcome", title: "Draft a welcome post", description: "Warm intro post for new members.", contentType: "post", prompt: "Draft a warm welcome post for new members of our community." },
  { id: "discussion", title: "Create a discussion prompt", description: "Spark conversation in a Space.", contentType: "discussion_prompt", prompt: "Create an engaging discussion prompt for our community Space." },
  { id: "weekly", title: "Generate weekly community update", description: "Roundup post for the week.", contentType: "post", prompt: "Write a weekly community update covering top posts, new members, and upcoming events." },
  { id: "summary", title: "Summarize top activity", description: "Quick platform health summary.", contentType: "summary", prompt: "Summarize the most important activity on the platform this week." },
  { id: "reengage", title: "Suggest inactive members to re-engage", description: "Identify at-risk members and draft outreach.", contentType: "engagement_plan", prompt: "Suggest which inactive members to re-engage and draft a friendly message." },
  { id: "event", title: "Draft an event description", description: "Compelling event copy.", contentType: "event_description", prompt: "Draft a clear, compelling description for an upcoming community event." },
  { id: "course", title: "Draft a course announcement", description: "Announce a new course or cohort.", contentType: "course_announcement", prompt: "Draft a course announcement that highlights value and call-to-action." },
  { id: "rewrite", title: "Rewrite a post in a warmer tone", description: "Soften and humanize copy.", contentType: "post", prompt: "Rewrite the following post in a warmer, more inclusive tone: [paste post]" },
  { id: "calendar", title: "Suggest a content calendar", description: "Plan posts for the next 2 weeks.", contentType: "engagement_plan", prompt: "Suggest a 2-week content calendar for our community." },
  { id: "spaces", title: "Suggest new Spaces", description: "Ideas for new community Spaces.", contentType: "space_idea", prompt: "Suggest 5 new Spaces we could open in our community and why." },
  { id: "checklist", title: "Create onboarding checklist ideas", description: "Steps for a great first week.", contentType: "checklist_idea", prompt: "Create an onboarding checklist of 6 great first-week steps for a new member." },
  { id: "engagement", title: "Suggest engagement improvements", description: "Tactical ideas to boost activity.", contentType: "engagement_plan", prompt: "Suggest concrete improvements to increase engagement in our community." },
];

/** Deterministic mock response builder so admins see realistic content even without an API key. */
export function buildMockResponse(prompt: string, contentType: AIContentType = "post"): { title: string; body: string } {
  const trimmed = prompt.trim().slice(0, 80);
  const map: Record<AIContentType, { title: string; body: string }> = {
    post: {
      title: "Welcome — let's get started",
      body: `Hi everyone 👋\n\nA quick note in response to: "${trimmed}".\n\nWe're glad you're here. Take a minute to:\n• Introduce yourself in the Feed\n• Join a Space that matches your interests\n• RSVP to an upcoming event\n\nLooking forward to seeing what you create.`,
    },
    announcement: {
      title: "Community update",
      body: `Hello team,\n\nIn response to: "${trimmed}", here's what's new this week — fresh discussions, an upcoming event, and a few new members to welcome.\n\nThanks for being part of this.`,
    },
    event_description: {
      title: "Live community session",
      body: `Join us for a live session on "${trimmed}".\n\nWe'll cover key questions, walk through examples, and leave time for Q&A. Bring your curiosity.`,
    },
    course_announcement: {
      title: "New course inside",
      body: `We just opened a new course inspired by: "${trimmed}".\n\nExpect short, practical lessons and a clear learning path. Enroll today and start your first lesson.`,
    },
    discussion_prompt: {
      title: "Quick question for the group",
      body: `Inspired by "${trimmed}" — what's one thing you'd love this community to discuss this week? Drop a reply with your idea.`,
    },
    checklist_idea: {
      title: "First-week checklist",
      body: `1. Complete your profile\n2. Say hi in the Feed\n3. Join 2 Spaces\n4. RSVP to an event\n5. Follow 3 members\n6. Save your first post`,
    },
    space_idea: {
      title: "Spaces to consider",
      body: `• Beginners Lounge — friendly Q&A\n• Build in Public — share progress\n• Show & Tell — weekly demos\n• Career Corner — opportunities\n• Off-topic — fun and casual`,
    },
    engagement_plan: {
      title: "Engagement plan",
      body: `Week 1: Welcome thread + intro prompt.\nWeek 2: Live AMA with a featured member.\nWeek 3: Themed challenge in a Space.\nWeek 4: Celebrate top contributors.`,
    },
    summary: {
      title: "Activity summary",
      body: `This week: new posts published, active Spaces leading the feed, and several new members onboarded. Keep nurturing top contributors and welcoming newcomers.`,
    },
  };
  return map[contentType] ?? map.post;
}

export interface ActivitySummary {
  newMembers: number;
  activePosts: number;
  activeSpaces: number;
  upcomingEvents: number;
  openReports: number;
}

export async function fetchActivitySummary(): Promise<ActivitySummary> {
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const nowIso = new Date().toISOString();
  const [{ count: members }, { count: posts }, { count: spaces }, { count: events }, { count: reports }] = await Promise.all([
    db.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    db.from("posts").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    db.from("spaces").select("*", { count: "exact", head: true }).eq("is_archived", false),
    db.from("events").select("*", { count: "exact", head: true }).gte("end_time", nowIso),
    db.from("reports").select("*", { count: "exact", head: true }).in("status", ["open", "under_review", "pending"]),
  ]);
  return {
    newMembers: members ?? 0,
    activePosts: posts ?? 0,
    activeSpaces: spaces ?? 0,
    upcomingEvents: events ?? 0,
    openReports: reports ?? 0,
  };
}

export async function fetchAtRiskMembers(): Promise<{ id: string; full_name: string | null; email: string | null }[]> {
  try {
    const { data } = await db.from("at_risk_members").select("id,full_name,email").limit(10);
    return (data ?? []) as any;
  } catch {
    return [];
  }
}
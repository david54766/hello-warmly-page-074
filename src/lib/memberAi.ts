import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type EngagementLevel = "high" | "medium" | "low" | "inactive";
export type RiskLevel = "none" | "low" | "medium" | "high";
export type AIContentSourceType =
  | "course" | "lesson" | "post" | "event" | "announcement"
  | "resource_placeholder" | "platform_page_placeholder";

export const SOURCE_TYPE_LABELS: Record<AIContentSourceType, string> = {
  course: "Course",
  lesson: "Lesson",
  post: "Post",
  event: "Event",
  announcement: "Announcement",
  resource_placeholder: "Resource (placeholder)",
  platform_page_placeholder: "Platform page",
};

export const ENGAGEMENT_LABELS: Record<EngagementLevel, string> = {
  high: "High", medium: "Medium", low: "Low", inactive: "Inactive",
};
export const RISK_LABELS: Record<RiskLevel, string> = {
  none: "None", low: "Low", medium: "Medium", high: "High",
};

export interface AIHelperSettings {
  id: string;
  member_ai_enabled: boolean;
  allow_course_content: boolean;
  allow_lesson_content: boolean;
  allow_post_content: boolean;
  allow_event_content: boolean;
  allow_resource_content: boolean;
  require_approved_sources: boolean;
  fallback_message: string;
  assistant_name: string;
  assistant_instructions: string;
  created_at: string;
  updated_at: string;
}

export interface AIContentSource {
  id: string;
  source_type: AIContentSourceType;
  source_id: string | null;
  title: string;
  content: string | null;
  visibility: string;
  approved_for_member_ai: boolean;
  embedding_status: string;
  created_at: string;
  updated_at: string;
}

export interface AIMemberInsight {
  id: string;
  user_id: string;
  summary: string;
  engagement_level: EngagementLevel;
  risk_level: RiskLevel;
  suggested_actions_json: string[];
  suggested_message: string | null;
  generated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberAIConversation {
  id: string;
  user_id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MemberAIMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  related_sources_json: { id: string; title: string; source_type: AIContentSourceType }[];
  created_at: string;
}

// ---------- Helper settings ----------
export async function getHelperSettings(): Promise<AIHelperSettings | null> {
  const { data } = await db.from("ai_helper_settings").select("*").order("created_at").limit(1).maybeSingle();
  return (data as AIHelperSettings) ?? null;
}
export async function upsertHelperSettings(patch: Partial<AIHelperSettings>): Promise<AIHelperSettings> {
  const cur = await getHelperSettings();
  if (!cur) {
    const { data, error } = await db.from("ai_helper_settings").insert(patch).select().single();
    if (error) throw error;
    return data as AIHelperSettings;
  }
  const { data, error } = await db.from("ai_helper_settings").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", cur.id).select().single();
  if (error) throw error;
  return data as AIHelperSettings;
}

// ---------- Content sources ----------
export async function listContentSources(filters?: { type?: AIContentSourceType | "all"; search?: string; approvedOnly?: boolean }): Promise<AIContentSource[]> {
  let q = db.from("ai_content_sources").select("*").order("created_at", { ascending: false });
  if (filters?.type && filters.type !== "all") q = q.eq("source_type", filters.type);
  if (filters?.approvedOnly) q = q.eq("approved_for_member_ai", true);
  if (filters?.search) q = q.ilike("title", `%${filters.search}%`);
  const { data } = await q;
  return (data ?? []) as AIContentSource[];
}
export async function toggleSourceApproval(id: string, approved: boolean): Promise<void> {
  const { error } = await db.from("ai_content_sources").update({ approved_for_member_ai: approved }).eq("id", id);
  if (error) throw error;
}
export async function createContentSource(input: Partial<AIContentSource>): Promise<AIContentSource> {
  const { data, error } = await db.from("ai_content_sources").insert(input).select().single();
  if (error) throw error;
  return data as AIContentSource;
}
export async function deleteContentSource(id: string): Promise<void> {
  await db.from("ai_content_sources").delete().eq("id", id);
}

// ---------- Member insights ----------
export async function getLatestInsight(userId: string): Promise<AIMemberInsight | null> {
  const { data } = await db.from("ai_member_insights").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return (data as AIMemberInsight) ?? null;
}

export async function listInsights(filters?: { engagement?: EngagementLevel | "all"; risk?: RiskLevel | "all" }): Promise<AIMemberInsight[]> {
  let q = db.from("ai_member_insights").select("*").order("created_at", { ascending: false }).limit(200);
  if (filters?.engagement && filters.engagement !== "all") q = q.eq("engagement_level", filters.engagement);
  if (filters?.risk && filters.risk !== "all") q = q.eq("risk_level", filters.risk);
  const { data } = await q;
  return (data ?? []) as AIMemberInsight[];
}

export interface MemberActivityStats {
  spaces_joined: number;
  courses_started: number;
  lessons_completed: number;
  events_rsvped: number;
  posts_created: number;
  comments_made: number;
  last_active_at: string | null;
  created_at: string | null;
}

export async function fetchMemberStats(userId: string): Promise<MemberActivityStats> {
  const [
    { count: spaces }, { count: courses }, { count: lessons }, { count: events },
    { count: posts }, { count: comments }, { data: profile }
  ] = await Promise.all([
    db.from("space_members").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "active"),
    db.from("lesson_progress").select("lesson_id", { count: "exact", head: true }).eq("user_id", userId),
    db.from("lesson_progress").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("completed", true),
    db.from("event_rsvps").select("*", { count: "exact", head: true }).eq("user_id", userId),
    db.from("posts").select("*", { count: "exact", head: true }).eq("author_id", userId),
    db.from("comments").select("*", { count: "exact", head: true }).eq("author_id", userId),
    db.from("profiles").select("last_active_at, created_at").eq("id", userId).maybeSingle(),
  ]);
  return {
    spaces_joined: spaces ?? 0,
    courses_started: courses ?? 0,
    lessons_completed: lessons ?? 0,
    events_rsvped: events ?? 0,
    posts_created: posts ?? 0,
    comments_made: comments ?? 0,
    last_active_at: profile?.last_active_at ?? null,
    created_at: profile?.created_at ?? null,
  };
}

function classifyEngagement(s: MemberActivityStats): EngagementLevel {
  const score = s.posts_created * 2 + s.comments_made + s.lessons_completed + s.events_rsvped + s.spaces_joined;
  const days = s.last_active_at ? (Date.now() - new Date(s.last_active_at).getTime()) / 86400_000 : 999;
  if (days > 30) return "inactive";
  if (score >= 15) return "high";
  if (score >= 5) return "medium";
  return "low";
}
function classifyRisk(s: MemberActivityStats, eng: EngagementLevel): RiskLevel {
  if (eng === "inactive") return "high";
  if (eng === "low" && s.posts_created === 0 && s.comments_made === 0) return "medium";
  if (eng === "low") return "low";
  return "none";
}

export async function generateInsight(userId: string, memberName: string | null): Promise<AIMemberInsight> {
  const stats = await fetchMemberStats(userId);
  const engagement = classifyEngagement(stats);
  const risk = classifyRisk(stats, engagement);
  const name = memberName || "This member";

  const parts: string[] = [];
  if (stats.created_at) {
    const days = Math.round((Date.now() - new Date(stats.created_at).getTime()) / 86400_000);
    parts.push(`${name} joined ${days} day${days === 1 ? "" : "s"} ago`);
  } else parts.push(`${name} is a community member`);
  if (stats.courses_started > 0) parts.push(`started ${stats.courses_started} course-related lessons`);
  if (stats.lessons_completed > 0) parts.push(`completed ${stats.lessons_completed} lessons`);
  if (stats.events_rsvped > 0) parts.push(`RSVPed to ${stats.events_rsvped} events`);
  if (stats.posts_created === 0 && stats.comments_made === 0) parts.push("has not posted or commented yet");
  else parts.push(`created ${stats.posts_created} posts and ${stats.comments_made} comments`);
  const summary = parts.join(", ") + ".";

  const actions: string[] = [];
  let message = "";
  if (engagement === "inactive") {
    actions.push("Send a friendly check-in message", "Highlight a new course or event", "Invite back to a Space");
    message = `Hey${memberName ? " " + memberName : ""}, we've missed you! There's been some great new conversations and a few new lessons since you've been away. Come say hi in the Welcome space when you have a minute.`;
  } else if (risk === "medium" || engagement === "low") {
    actions.push("Invite to introduce themselves in Welcome", "Suggest a beginner course", "Tag for re-engagement segment");
    message = `Hi${memberName ? " " + memberName : ""}! Glad to have you here. A great next step is to introduce yourself in the Welcome space — the community would love to meet you.`;
  } else if (engagement === "high") {
    actions.push("Award an engagement badge", "Invite to host a discussion", "Feature in next announcement");
    message = `Hi${memberName ? " " + memberName : ""}, thanks for being such an active part of the community! Would you be interested in helping host a discussion or sharing your story in an upcoming announcement?`;
  } else {
    actions.push("Suggest a course based on activity", "Invite to upcoming event", "Send a personal welcome message");
    message = `Hi${memberName ? " " + memberName : ""}! Nice to see you in the community. Have you seen our upcoming events? Could be a great way to meet other members.`;
  }

  const { data, error } = await db.from("ai_member_insights").insert({
    user_id: userId, summary, engagement_level: engagement, risk_level: risk,
    suggested_actions_json: actions, suggested_message: message,
  }).select().single();
  if (error) throw error;
  return data as AIMemberInsight;
}

// ---------- Member AI conversations ----------
export async function listMemberConversations(userId: string): Promise<MemberAIConversation[]> {
  const { data } = await db.from("member_ai_conversations").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
  return (data ?? []) as MemberAIConversation[];
}
export async function createMemberConversation(userId: string, title = "New conversation"): Promise<MemberAIConversation> {
  const { data, error } = await db.from("member_ai_conversations").insert({ user_id: userId, title }).select().single();
  if (error) throw error;
  return data as MemberAIConversation;
}
export async function deleteMemberConversation(id: string): Promise<void> {
  await db.from("member_ai_conversations").delete().eq("id", id);
}
export async function listMemberMessages(conversationId: string): Promise<MemberAIMessage[]> {
  const { data } = await db.from("member_ai_messages").select("*").eq("conversation_id", conversationId).order("created_at");
  return (data ?? []) as MemberAIMessage[];
}
export async function addMemberMessage(
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string,
  related: MemberAIMessage["related_sources_json"] = []
): Promise<MemberAIMessage> {
  const { data, error } = await db.from("member_ai_messages").insert({
    conversation_id: conversationId, role, content, related_sources_json: related,
  }).select().single();
  if (error) throw error;
  await db.from("member_ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
  return data as MemberAIMessage;
}

// ---------- Mock AI answer for member helper ----------
export async function buildMemberAIAnswer(
  question: string,
  settings: AIHelperSettings
): Promise<{ answer: string; related: MemberAIMessage["related_sources_json"] }> {
  const allowedTypes: AIContentSourceType[] = [];
  if (settings.allow_course_content) allowedTypes.push("course");
  if (settings.allow_lesson_content) allowedTypes.push("lesson");
  if (settings.allow_post_content) allowedTypes.push("post", "announcement");
  if (settings.allow_event_content) allowedTypes.push("event");
  if (settings.allow_resource_content) allowedTypes.push("resource_placeholder", "platform_page_placeholder");

  let q = db.from("ai_content_sources").select("*").in("source_type", allowedTypes).limit(50);
  if (settings.require_approved_sources) q = q.eq("approved_for_member_ai", true);
  const { data } = await q;
  const sources = (data ?? []) as AIContentSource[];

  const terms = question.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
  const scored = sources.map((s) => {
    const text = `${s.title} ${s.content ?? ""}`.toLowerCase();
    const score = terms.reduce((acc, t) => acc + (text.includes(t) ? 1 : 0), 0);
    return { s, score };
  }).sort((a, b) => b.score - a.score);

  const top = scored.filter((x) => x.score > 0).slice(0, 3).map((x) => x.s);
  if (top.length === 0) {
    return { answer: settings.fallback_message, related: [] };
  }
  const lead = `Here's what I found in the community that might help:`;
  const bullets = top.map((s) => `• **${s.title}** — ${(s.content ?? "").slice(0, 140)}${(s.content ?? "").length > 140 ? "…" : ""}`).join("\n");
  const trailer = `\n\nLet me know if you'd like more detail on any of these. I'm an AI helper, not a human — for personal or account questions, please reach out to an admin.`;
  return {
    answer: `${lead}\n\n${bullets}${trailer}`,
    related: top.map((s) => ({ id: s.id, title: s.title, source_type: s.source_type })),
  };
}
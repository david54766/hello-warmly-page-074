import { supabase } from "@/integrations/supabase/client";

const db: any = supabase;

export type SearchType =
  | "all" | "spaces" | "posts" | "courses" | "lessons" | "events" | "members" | "resources" | "announcements";

export interface SearchResult {
  id: string;
  type: Exclude<SearchType, "all">;
  title: string;
  description?: string | null;
  href: string;
  meta?: string | null;
}

export const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
  all: "All", spaces: "Spaces", posts: "Posts", courses: "Courses",
  lessons: "Lessons", events: "Events", members: "Members",
  resources: "Resources", announcements: "Announcements",
};

function ilike(q: string) {
  return `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
}

export async function searchAll(query: string, type: SearchType = "all", limit = 10): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const pattern = ilike(q);
  const buckets: Promise<SearchResult[]>[] = [];

  if (type === "all" || type === "spaces") {
    buckets.push(
      db.from("spaces").select("id,name,tagline,privacy_level,is_archived")
        .eq("is_archived", false).or(`name.ilike.${pattern},tagline.ilike.${pattern}`).limit(limit)
        .then(({ data }: any) => (data ?? []).map((r: any) => ({
          id: r.id, type: "spaces" as const, title: r.name, description: r.tagline,
          href: `/spaces/${r.id}`, meta: r.privacy_level,
        })))
    );
  }
  if (type === "all" || type === "posts") {
    buckets.push(
      db.from("posts").select("id,title,content,status").eq("status", "active")
        .or(`title.ilike.${pattern},content.ilike.${pattern}`).limit(limit)
        .then(({ data }: any) => (data ?? []).map((r: any) => ({
          id: r.id, type: "posts" as const, title: r.title || "Untitled post",
          description: (r.content ?? "").slice(0, 140), href: `/posts/${r.id}`,
        })))
    );
  }
  if (type === "all" || type === "courses") {
    buckets.push(
      db.from("courses").select("id,title,description,visibility,is_archived")
        .eq("is_archived", false).neq("visibility", "hidden")
        .or(`title.ilike.${pattern},description.ilike.${pattern}`).limit(limit)
        .then(({ data }: any) => (data ?? []).map((r: any) => ({
          id: r.id, type: "courses" as const, title: r.title, description: r.description,
          href: `/courses/${r.id}`,
        })))
    );
  }
  if (type === "all" || type === "lessons") {
    buckets.push(
      db.from("lessons").select("id,title,course_id,visibility")
        .neq("visibility", "hidden").ilike("title", pattern).limit(limit)
        .then(({ data }: any) => (data ?? []).map((r: any) => ({
          id: r.id, type: "lessons" as const, title: r.title,
          href: `/lessons/${r.id}`,
        })))
    );
  }
  if (type === "all" || type === "events") {
    buckets.push(
      db.from("events").select("id,title,description,start_time,visibility,status")
        .neq("visibility", "hidden").neq("status", "draft")
        .or(`title.ilike.${pattern},description.ilike.${pattern}`).limit(limit)
        .then(({ data }: any) => (data ?? []).map((r: any) => ({
          id: r.id, type: "events" as const, title: r.title, description: r.description,
          href: `/events/${r.id}`, meta: r.start_time ? new Date(r.start_time).toLocaleString() : null,
        })))
    );
  }
  if (type === "all" || type === "members") {
    buckets.push(
      db.from("profiles").select("id,full_name,email,bio,status").eq("status", "active")
        .or(`full_name.ilike.${pattern},email.ilike.${pattern},bio.ilike.${pattern}`).limit(limit)
        .then(({ data }: any) => (data ?? []).map((r: any) => ({
          id: r.id, type: "members" as const, title: r.full_name || r.email || "Member",
          description: r.bio, href: `/members/${r.id}`,
        })))
    );
  }
  if (type === "all" || type === "resources") {
    buckets.push(
      db.from("resources").select("id,title,description,visibility,is_archived")
        .eq("is_archived", false).neq("visibility", "hidden")
        .or(`title.ilike.${pattern},description.ilike.${pattern}`).limit(limit)
        .then(({ data }: any) => (data ?? []).map((r: any) => ({
          id: r.id, type: "resources" as const, title: r.title, description: r.description,
          href: `/resources/${r.id}`,
        })))
    );
  }
  if (type === "all" || type === "announcements") {
    buckets.push(
      db.from("admin_announcements").select("id,title,body,status")
        .eq("status", "sent").or(`title.ilike.${pattern},body.ilike.${pattern}`).limit(limit)
        .then(({ data }: any) => (data ?? []).map((r: any) => ({
          id: r.id, type: "announcements" as const, title: r.title,
          description: (r.body ?? "").slice(0, 140), href: `/announcements/${r.id}`,
        })))
    );
  }

  const results = (await Promise.all(buckets)).flat();
  return results;
}

export async function logSearch(userId: string, query: string, filters: Record<string, any> = {}) {
  if (!userId || !query.trim()) return;
  await db.from("search_events").insert({ user_id: userId, query: query.trim(), filters_json: filters });
}

export async function fetchRecentSearches(userId: string, limit = 8): Promise<{ id: string; query: string; created_at: string }[]> {
  const { data } = await db.from("search_events").select("id,query,created_at")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  // dedupe by query
  const seen = new Set<string>();
  return (data ?? []).filter((r: any) => {
    if (seen.has(r.query)) return false;
    seen.add(r.query);
    return true;
  });
}

export async function clearRecentSearches(userId: string) {
  await db.from("search_events").delete().eq("user_id", userId);
}
import { supabase } from "@/integrations/supabase/client";
import type { Hashtag, QuestionDetails } from "./feed";

/** Fetch hashtag names attached to a post. */
export async function fetchPostHashtags(postId: string): Promise<string[]> {
  const sb = supabase as any;
  const { data } = await sb
    .from("post_hashtags")
    .select("hashtag_id, hashtags ( name )")
    .eq("post_id", postId);
  return ((data ?? []) as { hashtags: { name: string } | null }[])
    .map((r) => r.hashtags?.name)
    .filter((x): x is string => !!x);
}

/** Fetch hashtags for many posts, returning a Map<postId, string[]>. */
export async function fetchHashtagsForPosts(postIds: string[]): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (!postIds.length) return out;
  const sb = supabase as any;
  const { data } = await sb
    .from("post_hashtags")
    .select("post_id, hashtags ( name )")
    .in("post_id", postIds);
  ((data ?? []) as { post_id: string; hashtags: { name: string } | null }[]).forEach((r) => {
    if (!r.hashtags) return;
    const arr = out.get(r.post_id) ?? [];
    arr.push(r.hashtags.name);
    out.set(r.post_id, arr);
  });
  return out;
}

export async function fetchQuestionDetails(postId: string): Promise<QuestionDetails | null> {
  const sb = supabase as any;
  const { data } = await sb.from("question_details").select("*").eq("post_id", postId).maybeSingle();
  return (data as QuestionDetails) ?? null;
}

export async function fetchQuestionDetailsForPosts(postIds: string[]): Promise<Map<string, QuestionDetails>> {
  const out = new Map<string, QuestionDetails>();
  if (!postIds.length) return out;
  const sb = supabase as any;
  const { data } = await sb.from("question_details").select("*").in("post_id", postIds);
  ((data ?? []) as QuestionDetails[]).forEach((q) => out.set(q.post_id, q));
  return out;
}

export async function setBestAnswer(postId: string, commentId: string) {
  const sb = supabase as any;
  return sb
    .from("question_details")
    .update({ best_answer_comment_id: commentId, is_answered: true })
    .eq("post_id", postId);
}

export async function clearBestAnswer(postId: string) {
  const sb = supabase as any;
  return sb
    .from("question_details")
    .update({ best_answer_comment_id: null, is_answered: false })
    .eq("post_id", postId);
}

/** List trending hashtags by usage_count. */
export async function fetchTrendingHashtags(limit = 10): Promise<Hashtag[]> {
  const sb = supabase as any;
  const { data } = await sb
    .from("hashtags")
    .select("*")
    .gt("usage_count", 0)
    .order("usage_count", { ascending: false })
    .limit(limit);
  return (data ?? []) as Hashtag[];
}
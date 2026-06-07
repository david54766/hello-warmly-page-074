import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Post, Reaction, QuestionDetails } from "@/lib/feed";
import type { Space } from "@/lib/spaces";
import { fetchHashtagsForPosts, fetchQuestionDetailsForPosts } from "@/lib/postExtras";

export interface AuthorLite { id: string; full_name: string | null; email: string | null; avatar_url: string | null }

export interface FeedState {
  loading: boolean;
  posts: Post[];
  spaces: Space[];
  authors: Map<string, AuthorLite>;
  reactions: Reaction[];
  commentCounts: Map<string, number>;
  adminUserIds: Set<string>;
  hashtagsByPost: Map<string, string[]>;
  questionDetailsByPost: Map<string, QuestionDetails>;
  refresh: () => Promise<void>;
}

/**
 * Loads posts (RLS already constrains to accessible posts), plus the
 * related spaces, authors, reactions, comment counts, and admin user ids
 * needed to render and filter the feed.
 */
export function useFeedData(opts: { spaceId?: string } = {}): FeedState {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [authors, setAuthors] = useState<Map<string, AuthorLite>>(new Map());
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [commentCounts, setCommentCounts] = useState<Map<string, number>>(new Map());
  const [adminUserIds, setAdminUserIds] = useState<Set<string>>(new Set());
  const [hashtagsByPost, setHashtagsByPost] = useState<Map<string, string[]>>(new Map());
  const [questionDetailsByPost, setQuestionDetailsByPost] = useState<Map<string, QuestionDetails>>(new Map());

  const refresh = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("posts")
      .select("*")
      .eq("status", "active")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);
    if (opts.spaceId) q = q.eq("space_id", opts.spaceId);
    const { data: postRows } = await q;
    const ps = (postRows ?? []) as Post[];
    setPosts(ps);

    const spaceIds = Array.from(new Set(ps.map((p) => p.space_id)));
    const authorIds = Array.from(new Set(ps.map((p) => p.author_id).filter((x): x is string => !!x)));
    const postIds = ps.map((p) => p.id);

    const questionIds = ps.filter((p) => p.post_type === "question").map((p) => p.id);
    const [spRes, authRes, reactRes, commRes, adminRes, hashtagMap, qdMap] = await Promise.all([
      spaceIds.length
        ? supabase.from("spaces").select("*").in("id", spaceIds)
        : Promise.resolve({ data: [] as Space[] }),
      authorIds.length
        ? supabase.from("profiles").select("id,full_name,email,avatar_url").in("id", authorIds)
        : Promise.resolve({ data: [] as AuthorLite[] }),
      postIds.length
        ? supabase.from("reactions").select("*").eq("target_type", "post").in("target_id", postIds)
        : Promise.resolve({ data: [] as Reaction[] }),
      postIds.length
        ? supabase.from("comments").select("post_id").in("post_id", postIds).eq("status", "active")
        : Promise.resolve({ data: [] as { post_id: string }[] }),
      supabase.from("user_roles").select("user_id,role").in("role", ["platform_admin", "moderator"]),
      fetchHashtagsForPosts(postIds),
      fetchQuestionDetailsForPosts(questionIds),
    ]);

    setSpaces((spRes.data ?? []) as Space[]);
    setAuthors(new Map(((authRes.data ?? []) as AuthorLite[]).map((a) => [a.id, a])));
    setReactions((reactRes.data ?? []) as Reaction[]);
    const cc = new Map<string, number>();
    (commRes.data ?? []).forEach((c) => cc.set(c.post_id, (cc.get(c.post_id) ?? 0) + 1));
    setCommentCounts(cc);
    setAdminUserIds(new Set((adminRes.data ?? []).map((r) => r.user_id)));
    setHashtagsByPost(hashtagMap);
    setQuestionDetailsByPost(qdMap);
    setLoading(false);
  }, [opts.spaceId]);

  useEffect(() => { refresh(); }, [refresh]);

  return useMemo(
    () => ({ loading, posts, spaces, authors, reactions, commentCounts, adminUserIds, hashtagsByPost, questionDetailsByPost, refresh }),
    [loading, posts, spaces, authors, reactions, commentCounts, adminUserIds, hashtagsByPost, questionDetailsByPost, refresh]
  );
}
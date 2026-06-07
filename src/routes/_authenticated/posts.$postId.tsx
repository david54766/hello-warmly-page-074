import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/DashboardCard";
import { PostCard } from "@/components/feed/PostCard";
import { CommentThread, type CommentAuthor } from "@/components/feed/CommentThread";
import type { Post, Comment, Reaction, QuestionDetails } from "@/lib/feed";
import type { Space } from "@/lib/spaces";
import { fetchPostHashtags, fetchQuestionDetails } from "@/lib/postExtras";
import { ArrowLeft, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/posts/$postId")({
  component: PostDetailPage,
});

function PostDetailPage() {
  const { postId } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);
  const [space, setSpace] = useState<Space | null>(null);
  const [author, setAuthor] = useState<CommentAuthor | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [authors, setAuthors] = useState<Map<string, CommentAuthor>>(new Map());
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [questionDetails, setQuestionDetails] = useState<QuestionDetails | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: p } = await supabase.from("posts").select("*").eq("id", postId).maybeSingle();
    if (!p) { setPost(null); setLoading(false); return; }
    setPost(p as Post);

    const [{ data: sp }, { data: au }, { data: cm }, { data: rx }] = await Promise.all([
      supabase.from("spaces").select("*").eq("id", p.space_id).maybeSingle(),
      p.author_id
        ? supabase.from("profiles").select("id,full_name,email,avatar_url").eq("id", p.author_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("comments").select("*").eq("post_id", postId).order("created_at"),
      supabase.from("reactions").select("*").or(`and(target_type.eq.post,target_id.eq.${postId})`),
    ]);
    setSpace((sp as Space) ?? null);
    setAuthor((au as CommentAuthor) ?? null);
    const cmts = (cm ?? []) as Comment[];
    setComments(cmts);

    const commentIds = cmts.map((c) => c.id);
    const commentReactions = commentIds.length
      ? (await supabase.from("reactions").select("*").eq("target_type", "comment").in("target_id", commentIds)).data ?? []
      : [];
    setReactions([...(rx ?? []), ...commentReactions] as Reaction[]);

    const authorIds = Array.from(new Set([
      ...(p.author_id ? [p.author_id] : []),
      ...cmts.map((c) => c.author_id).filter((x): x is string => !!x),
    ]));
    const { data: profs } = authorIds.length
      ? await supabase.from("profiles").select("id,full_name,email,avatar_url").in("id", authorIds)
      : { data: [] as CommentAuthor[] };
    setAuthors(new Map(((profs ?? []) as CommentAuthor[]).map((a) => [a.id, a])));
    const [tags, qd] = await Promise.all([
      fetchPostHashtags(postId),
      p.post_type === "question" ? fetchQuestionDetails(postId) : Promise.resolve(null),
    ]);
    setHashtags(tags);
    setQuestionDetails(qd);
    setLoading(false);
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto w-full">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }
  if (!post) {
    return (
      <EmptyState
        title="Post not found"
        description="This post may have been removed or you may not have access."
        action={<Button onClick={() => navigate({ to: "/feed" })}>Back to feed</Button>}
      />
    );
  }

  const postReactions = reactions.filter((r) => r.target_type === "post" && r.target_id === post.id);

  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild><Link to="/feed"><ArrowLeft className="size-4 mr-1" />Back to feed</Link></Button>
        {space && (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/spaces/$spaceId" params={{ spaceId: space.id }}>View Space</Link>
          </Button>
        )}
      </div>
      <PostCard
        post={post}
        space={space ? { id: space.id, name: space.name } : null}
        author={author}
        reactions={postReactions}
        commentCount={comments.length}
        onChange={load}
        linkToDetail={false}
        hashtags={hashtags}
        isAnswered={questionDetails?.is_answered ?? false}
      />
      <Card className="rounded-2xl">
        <CardContent className="pt-5 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="size-4" />Comments ({comments.length})
          </h2>
          <CommentThread
            postId={post.id}
            comments={comments}
            reactions={reactions}
            authors={authors}
            onChange={load}
            postAuthorId={post.author_id}
            postType={post.post_type}
            bestAnswerCommentId={questionDetails?.best_answer_comment_id ?? null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
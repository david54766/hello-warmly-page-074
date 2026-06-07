import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PostCard } from "./PostCard";
import { PostComposer } from "./PostComposer";
import { FeedFilters, type FeedFilterValue, type FeedSort } from "./FeedFilters";
import { EmptyState, DashboardCard } from "@/components/app/DashboardCard";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";
import { useFeedData } from "@/lib/useFeedData";
import type { Space } from "@/lib/spaces";
import { useEffect } from "react";
import { fetchFollowing } from "@/lib/onboarding";

export function FeedList({
  scopeSpaceId,
  joinableSpaces,
  emptyTitle,
  emptyDescription,
  showFilters = true,
  hashtagFilter,
}: {
  /** When set, only posts in this space are loaded and composed. */
  scopeSpaceId?: string;
  /** Spaces the current user is allowed to post in (for the global composer). */
  joinableSpaces?: Space[];
  emptyTitle?: string;
  emptyDescription?: string;
  showFilters?: boolean;
  /** If set, only posts tagged with this hashtag are shown. */
  hashtagFilter?: string;
}) {
  const { user } = useAuth();
  const { loading, posts, spaces, authors, reactions, commentCounts, adminUserIds, hashtagsByPost, questionDetailsByPost, refresh } =
    useFeedData({ spaceId: scopeSpaceId });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FeedFilterValue>("all");
  const [sort, setSort] = useState<FeedSort>("newest");
  const [spaceFilter, setSpaceFilter] = useState("");
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  useEffect(() => { if (user) fetchFollowing(user.id).then((ids) => setFollowingIds(new Set(ids))); }, [user]);

  const spacesById = useMemo(() => new Map(spaces.map((s) => [s.id, s])), [spaces]);
  const reactionCountsByPost = useMemo(() => {
    const m = new Map<string, number>();
    reactions.forEach((r) => m.set(r.target_id, (m.get(r.target_id) ?? 0) + 1));
    return m;
  }, [reactions]);

  const composerSpaces = scopeSpaceId ? [] : (joinableSpaces ?? []);

  const filtered = useMemo(() => {
    let arr = posts.slice();
    if (spaceFilter) arr = arr.filter((p) => p.space_id === spaceFilter);
    if (hashtagFilter) {
      const tag = hashtagFilter.toLowerCase();
      arr = arr.filter((p) => (hashtagsByPost.get(p.id) ?? []).includes(tag));
    }
    switch (filter) {
      case "following": arr = arr.filter((p) => p.author_id && followingIds.has(p.author_id)); break;
      case "posts": arr = arr.filter((p) => p.post_type === "quick_post"); break;
      case "articles": arr = arr.filter((p) => p.post_type === "article"); break;
      case "questions": arr = arr.filter((p) => p.post_type === "question"); break;
      case "unanswered": arr = arr.filter((p) => p.post_type === "question" && !(questionDetailsByPost.get(p.id)?.is_answered)); break;
      case "polls": arr = arr.filter((p) => p.post_type === "poll"); break;
      case "from_admins": arr = arr.filter((p) => p.author_id && adminUserIds.has(p.author_id)); break;
      case "pinned": arr = arr.filter((p) => p.is_pinned); break;
      case "featured": arr = arr.filter((p) => p.is_featured); break;
      case "my_posts": arr = arr.filter((p) => p.author_id === user?.id); break;
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter((p) =>
        (p.title?.toLowerCase().includes(q) ?? false) ||
        p.body.toLowerCase().includes(q) ||
        (hashtagsByPost.get(p.id) ?? []).some((t) => t.includes(q.replace(/^#/, "")))
      );
    }
    if (sort === "top") {
      arr.sort((a, b) => {
        const ra = reactionCountsByPost.get(a.id) ?? 0;
        const rb = reactionCountsByPost.get(b.id) ?? 0;
        if (rb !== ra) return rb - ra;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else {
      // already pinned-first + newest from query, but enforce again after filtering
      arr.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    return arr;
  }, [posts, filter, search, sort, spaceFilter, adminUserIds, user, reactionCountsByPost, followingIds, hashtagFilter, hashtagsByPost, questionDetailsByPost]);

  return (
    <div className="space-y-4">
      <PostComposer
        spaces={composerSpaces}
        defaultSpaceId={scopeSpaceId}
        onPosted={refresh}
      />

      {showFilters && (
        <FeedFilters
          search={search} onSearchChange={setSearch}
          filter={filter} onFilterChange={setFilter}
          sort={sort} onSortChange={setSort}
          spaceId={scopeSpaceId ? undefined : spaceFilter}
          onSpaceChange={scopeSpaceId ? undefined : setSpaceFilter}
          spaces={scopeSpaceId ? undefined : spaces}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <DashboardCard title="Feed" icon={<MessageSquare className="size-4" />}>
          <EmptyState
            icon={<MessageSquare className="size-5" />}
            title={emptyTitle ?? "No posts yet"}
            description={emptyDescription ?? "Start the conversation by sharing an update, question, or resource."}
          />
        </DashboardCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              space={spacesById.get(p.space_id) ?? null}
              author={authors.get(p.author_id ?? "") ?? null}
              reactions={reactions.filter((r) => r.target_type === "post" && r.target_id === p.id)}
              commentCount={commentCounts.get(p.id) ?? 0}
              onChange={refresh}
              hashtags={hashtagsByPost.get(p.id) ?? []}
              isAnswered={questionDetailsByPost.get(p.id)?.is_answered ?? false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
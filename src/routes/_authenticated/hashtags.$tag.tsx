import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FeedList } from "@/components/feed/FeedList";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Hash } from "lucide-react";
import type { Space } from "@/lib/spaces";
import { useAuth } from "@/hooks/useAuth";
import { fetchTrendingHashtags } from "@/lib/postExtras";
import type { Hashtag } from "@/lib/feed";
import { HashtagPill } from "@/components/feed/HashtagPill";

export const Route = createFileRoute("/_authenticated/hashtags/$tag")({
  component: HashtagPage,
});

function HashtagPage() {
  const { tag } = Route.useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [joinable, setJoinable] = useState<Space[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [trending, setTrending] = useState<Hashtag[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (isAdmin) {
        const { data } = await supabase.from("spaces").select("*").eq("is_archived", false).order("sort_order");
        setJoinable((data ?? []) as Space[]);
      } else {
        const { data: mem } = await supabase.from("space_members").select("space_id").eq("user_id", user.id).eq("status", "active");
        const ids = (mem ?? []).map((m) => m.space_id);
        if (!ids.length) return setJoinable([]);
        const { data } = await supabase.from("spaces").select("*").in("id", ids).eq("is_archived", false).order("sort_order");
        setJoinable((data ?? []) as Space[]);
      }
    })();
  }, [user, isAdmin]);

  useEffect(() => {
    (async () => {
      const sb = supabase as any;
      const { data } = await sb.from("hashtags").select("usage_count").eq("name", tag.toLowerCase()).maybeSingle();
      setCount(data?.usage_count ?? 0);
    })();
    fetchTrendingHashtags(8).then(setTrending);
  }, [tag]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/feed" })}>
        <ArrowLeft className="size-4 mr-1" />Back to feed
      </Button>
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
            <Hash className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">#{tag.toLowerCase()}</h1>
            <p className="text-sm text-muted-foreground">
              {count === null ? "…" : `${count} ${count === 1 ? "post" : "posts"} tagged with this hashtag.`}
            </p>
          </div>
        </div>
      </header>

      <FeedList
        joinableSpaces={joinable}
        hashtagFilter={tag.toLowerCase()}
        emptyTitle="No posts yet"
        emptyDescription="No accessible posts use this hashtag right now."
        showFilters={false}
      />

      {trending.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-2 text-muted-foreground">Trending hashtags</h2>
          <div className="flex flex-wrap gap-1.5">
            {trending.map((h) => (
              <HashtagPill key={h.id} name={h.name} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
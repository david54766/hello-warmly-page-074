import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FeedList } from "@/components/feed/FeedList";
import { TrendingHashtagsCard } from "@/components/feed/TrendingHashtagsCard";
import type { Space } from "@/lib/spaces";

export const Route = createFileRoute("/_authenticated/feed")({
  component: FeedPage,
});

function FeedPage() {
  const { user, isAdmin } = useAuth();
  const [joinable, setJoinable] = useState<Space[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (isAdmin) {
        const { data } = await supabase.from("spaces").select("*").eq("is_archived", false).order("sort_order");
        setJoinable((data ?? []) as Space[]);
        return;
      }
      const { data: mem } = await supabase.from("space_members").select("space_id").eq("user_id", user.id).eq("status", "active");
      const ids = (mem ?? []).map((m) => m.space_id);
      if (!ids.length) return setJoinable([]);
      const { data } = await supabase.from("spaces").select("*").in("id", ids).eq("is_archived", false).order("sort_order");
      setJoinable((data ?? []) as Space[]);
    })();
  }, [user, isAdmin]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Community Feed</h1>
        <p className="text-muted-foreground mt-1">
          See the latest updates, questions, and conversations from the Spaces you can access.
        </p>
      </header>
      <FeedList joinableSpaces={joinable} />
      <TrendingHashtagsCard limit={12} />
    </div>
  );
}
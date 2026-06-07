import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchFollowing } from "@/lib/onboarding";
import { FollowersList } from "@/components/onboarding/FollowersList";
import { SuggestedMembersCard } from "@/components/onboarding/SuggestedMembersCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { memberInitials } from "@/lib/members";
import { timeAgo, type Post } from "@/lib/feed";
import { EmptyState } from "@/components/app/DashboardCard";
import { Newspaper } from "lucide-react";

export const Route = createFileRoute("/_authenticated/following")({
  component: FollowingPage,
});

function FollowingPage() {
  const { user } = useAuth();
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [authors, setAuthors] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    if (!user) return;
    (async () => {
      const ids = await fetchFollowing(user.id);
      setFollowingIds(ids);
      if (!ids.length) { setPosts([]); return; }
      const { data: ps } = await supabase.from("posts").select("*").in("author_id", ids).eq("status", "active").order("created_at", { ascending: false }).limit(30);
      setPosts((ps ?? []) as Post[]);
      const { data: profs } = await supabase.from("profiles").select("id,full_name,email,avatar_url").in("id", ids);
      setAuthors(new Map((profs ?? []).map((p: any) => [p.id, p])));
    })();
  }, [user]);

  const orderedAuthors = useMemo(() => followingIds, [followingIds]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Following</h1>
        <p className="text-muted-foreground mt-1">Stay close to the people whose work you don't want to miss.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader className="pb-2"><CardTitle className="text-base">Recent posts</CardTitle></CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <EmptyState icon={<Newspaper className="size-5" />} title="No posts yet" description="Posts from people you follow will appear here." />
              ) : (
                <ul className="divide-y">
                  {posts.map((p) => {
                    const a = authors.get(p.author_id ?? "");
                    return (
                      <li key={p.id} className="py-3 flex items-start gap-3">
                        <Avatar className="size-9"><AvatarImage src={a?.avatar_url || undefined} /><AvatarFallback>{memberInitials(a?.full_name, a?.email)}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm"><span className="font-medium">{a?.full_name || a?.email || "Member"}</span> <span className="text-muted-foreground">· {timeAgo(p.created_at)}</span></div>
                          <Link to="/posts/$postId" params={{ postId: p.id }} className="text-sm font-semibold hover:underline line-clamp-1">{p.title || p.body.slice(0, 80)}</Link>
                          {p.title && <p className="text-sm text-muted-foreground line-clamp-2">{p.body}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Members you follow</h2>
            <FollowersList userIds={orderedAuthors} emptyTitle="You're not following anyone yet" emptyDescription="Use the suggestions on the right to start following members." />
          </section>
        </div>
        <aside>
          <SuggestedMembersCard limit={5} />
        </aside>
      </div>
    </div>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardCard, EmptyState } from "@/components/app/DashboardCard";
import { SpaceCard } from "@/components/app/SpaceCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { Collection, Space } from "@/lib/spaces";
import { BookOpen, Users2, MessageSquare, Calendar, UserCircle2, Bookmark, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [memberRows, setMemberRows] = useState<{ space_id: string; user_id: string }[]>([]);

  const load = async () => {
    setLoading(true);
    const [{ data: sp }, { data: col }, { data: mem }] = await Promise.all([
      supabase.from("spaces").select("*").eq("is_archived", false).order("sort_order").limit(8),
      supabase.from("collections").select("*").order("sort_order"),
      supabase.from("space_members").select("space_id,user_id").eq("status", "active"),
    ]);
    setSpaces((sp ?? []) as Space[]);
    setCollections((col ?? []) as Collection[]);
    setMemberRows(mem ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    memberRows.forEach((r) => m.set(r.space_id, (m.get(r.space_id) ?? 0) + 1));
    return m;
  }, [memberRows]);
  const mySpaces = useMemo(() => new Set(memberRows.filter((r) => r.user_id === user?.id).map((r) => r.space_id)), [memberRows, user]);
  const collectionsById = useMemo(() => new Map(collections.map((c) => [c.id, c])), [collections]);

  const featured = spaces.slice(0, 4);

  const cards = [
    { title: "Continue Learning", icon: <BookOpen className="size-4" />, msg: "Your courses will appear here." },
    { title: "Latest Discussions", icon: <MessageSquare className="size-4" />, msg: "Conversations from your spaces." },
    { title: "Upcoming Events", icon: <Calendar className="size-4" />, msg: "Live sessions and meetups." },
    { title: "Suggested Members", icon: <UserCircle2 className="size-4" />, msg: "People you may want to follow." },
    { title: "Saved Resources", icon: <Bookmark className="size-4" />, msg: "Bookmarks and downloads." },
  ];
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in your community today.</p>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Users2 className="size-5" />Featured Spaces</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/spaces">Explore all <ArrowRight className="size-4 ml-1" /></Link>
          </Button>
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : featured.length === 0 ? (
          <EmptyState icon={<Users2 className="size-5" />} title="No Spaces yet" description="Spaces will appear here as they're created." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((s) => (
              <SpaceCard
                key={s.id}
                space={s}
                collectionName={collectionsById.get(s.collection_id ?? "")?.name}
                memberCount={counts.get(s.id) ?? 0}
                isMember={mySpaces.has(s.id)}
                onJoinChange={load}
              />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <DashboardCard key={c.title} title={c.title} icon={c.icon} comingSoon>
            <p className="text-sm text-muted-foreground">{c.msg}</p>
          </DashboardCard>
        ))}
      </div>
    </div>
  );
}
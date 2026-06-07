import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AdminStatCard, EmptyState } from "@/components/app/DashboardCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Users, UserPlus, Users2, MessageSquare, MessageCircle, Heart,
  GraduationCap, BookOpen, CheckCircle2, Calendar, CalendarCheck,
  ShieldAlert, ArrowRight, BarChart3,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AnalyticsPage,
});

type Stats = {
  members: number; newMembers: number; spaces: number;
  posts: number; comments: number; reactions: number;
  courses: number; lessons: number; lessonsCompleted: number;
  events: number; rsvps: number; openReports: number;
};

type TopSpace = { id: string; name: string; member_count: number };
type TopPost = { id: string; title: string | null; body: string; reactions: number; comments: number };
type ActiveMember = { id: string; full_name: string | null; email: string | null; last_active_at: string | null };

function AnalyticsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [topSpaces, setTopSpaces] = useState<TopSpace[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [active, setActive] = useState<ActiveMember[]>([]);
  const [recentCompletions, setRecentCompletions] = useState<number>(0);
  const [recentRsvps, setRecentRsvps] = useState<number>(0);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate({ to: "/dashboard" });
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString();

      const head = { count: "exact" as const, head: true };
      const sb: any = supabase;
      const [
        members, newMembers, spaces, posts, comments, reactions,
        courses, lessons, lessonsCompleted, events, rsvps, openReports,
        completions30d, rsvps30d,
        spacesAll, postsForTop, reactionsForTop, commentsForTop,
        activeMembers,
      ] = await Promise.all([
        supabase.from("profiles").select("*", head),
        supabase.from("profiles").select("*", head).gte("created_at", monthAgo),
        supabase.from("spaces").select("*", head).eq("is_archived", false),
        supabase.from("posts").select("*", head).eq("status", "active"),
        supabase.from("comments").select("*", head).eq("status", "active"),
        supabase.from("reactions").select("*", head),
        supabase.from("courses").select("*", head).eq("is_archived", false),
        supabase.from("lessons").select("*", head),
        sb.from("lesson_progress").select("*", head).eq("status", "completed"),
        sb.from("events").select("*", head),
        sb.from("event_rsvps").select("*", head),
        supabase.from("reports").select("*", head).in("status", ["open", "under_review", "pending"]),
        sb.from("lesson_progress").select("*", head).eq("status", "completed").gte("completed_at", monthAgo),
        sb.from("event_rsvps").select("*", head).gte("created_at", monthAgo),
        supabase.from("spaces").select("id,name").eq("is_archived", false),
        supabase.from("posts").select("id,title,body").eq("status", "active").order("created_at", { ascending: false }).limit(50),
        supabase.from("reactions").select("target_id,target_type").eq("target_type", "post"),
        supabase.from("comments").select("post_id").eq("status", "active"),
        supabase.from("profiles").select("id,full_name,email,last_active_at").order("last_active_at", { ascending: false, nullsFirst: false }).limit(8),
      ]);

      // Top spaces by member count
      const { data: smRows } = await supabase.from("space_members").select("space_id").eq("status", "active");
      const counts = new Map<string, number>();
      (smRows ?? []).forEach((r: any) => counts.set(r.space_id, (counts.get(r.space_id) ?? 0) + 1));
      const top = (spacesAll.data ?? [])
        .map((s: any) => ({ id: s.id, name: s.name, member_count: counts.get(s.id) ?? 0 }))
        .sort((a, b) => b.member_count - a.member_count)
        .slice(0, 5);
      setTopSpaces(top);

      // Top posts by reactions+comments
      const reactByPost = new Map<string, number>();
      (reactionsForTop.data ?? []).forEach((r: any) => reactByPost.set(r.target_id, (reactByPost.get(r.target_id) ?? 0) + 1));
      const commentsByPost = new Map<string, number>();
      (commentsForTop.data ?? []).forEach((c: any) => commentsByPost.set(c.post_id, (commentsByPost.get(c.post_id) ?? 0) + 1));
      const ranked = (postsForTop.data ?? [])
        .map((p: any) => ({
          id: p.id, title: p.title, body: p.body ?? "",
          reactions: reactByPost.get(p.id) ?? 0,
          comments: commentsByPost.get(p.id) ?? 0,
        }))
        .sort((a, b) => (b.reactions + b.comments) - (a.reactions + a.comments))
        .slice(0, 5);
      setTopPosts(ranked);

      setActive((activeMembers.data ?? []) as ActiveMember[]);
      setRecentCompletions(completions30d.count ?? 0);
      setRecentRsvps(rsvps30d.count ?? 0);

      setStats({
        members: members.count ?? 0,
        newMembers: newMembers.count ?? 0,
        spaces: spaces.count ?? 0,
        posts: posts.count ?? 0,
        comments: comments.count ?? 0,
        reactions: reactions.count ?? 0,
        courses: courses.count ?? 0,
        lessons: lessons.count ?? 0,
        lessonsCompleted: lessonsCompleted.count ?? 0,
        events: events.count ?? 0,
        rsvps: rsvps.count ?? 0,
        openReports: openReports.count ?? 0,
      });
      setLoading(false);
    })();
  }, [isAdmin]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Platform Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track member growth, content activity, learning progress, and event engagement.
        </p>
      </header>

      {loading || !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard label="Total Members" value={stats.members} icon={<Users className="size-4 text-muted-foreground" />} />
            <AdminStatCard label="New Members (30d)" value={stats.newMembers} icon={<UserPlus className="size-4 text-muted-foreground" />} />
            <AdminStatCard label="Total Spaces" value={stats.spaces} icon={<Users2 className="size-4 text-muted-foreground" />} />
            <AdminStatCard label="Open Reports" value={stats.openReports} icon={<ShieldAlert className="size-4 text-muted-foreground" />} />
            <AdminStatCard label="Posts" value={stats.posts} icon={<MessageSquare className="size-4 text-muted-foreground" />} />
            <AdminStatCard label="Comments" value={stats.comments} icon={<MessageCircle className="size-4 text-muted-foreground" />} />
            <AdminStatCard label="Reactions" value={stats.reactions} icon={<Heart className="size-4 text-muted-foreground" />} />
            <AdminStatCard label="Courses" value={stats.courses} icon={<GraduationCap className="size-4 text-muted-foreground" />} />
            <AdminStatCard label="Lessons" value={stats.lessons} icon={<BookOpen className="size-4 text-muted-foreground" />} />
            <AdminStatCard label="Lessons Completed" value={stats.lessonsCompleted} hint={`${recentCompletions} in last 30d`} icon={<CheckCircle2 className="size-4 text-muted-foreground" />} />
            <AdminStatCard label="Events" value={stats.events} icon={<Calendar className="size-4 text-muted-foreground" />} />
            <AdminStatCard label="Event RSVPs" value={stats.rsvps} hint={`${recentRsvps} in last 30d`} icon={<CalendarCheck className="size-4 text-muted-foreground" />} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Users2 className="size-4" /> Top Spaces by members</CardTitle>
              </CardHeader>
              <CardContent>
                {topSpaces.length === 0 ? (
                  <EmptyState icon={<BarChart3 className="size-5" />} title="No spaces yet" description="Once spaces gain members, they'll rank here." />
                ) : (
                  <ul className="divide-y">
                    {topSpaces.map((s, i) => (
                      <li key={s.id} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-sm tabular-nums w-6 text-muted-foreground">#{i + 1}</span>
                          <Link to="/admin/spaces/$spaceId" params={{ spaceId: s.id }} className="font-medium truncate hover:underline">{s.name}</Link>
                        </div>
                        <span className="text-sm text-muted-foreground tabular-nums">{s.member_count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="size-4" /> Top Posts by engagement</CardTitle>
              </CardHeader>
              <CardContent>
                {topPosts.length === 0 ? (
                  <EmptyState icon={<BarChart3 className="size-5" />} title="No engagement yet" description="Reactions and comments will surface top posts here." />
                ) : (
                  <ul className="divide-y">
                    {topPosts.map((p) => (
                      <li key={p.id} className="py-2.5 flex items-start justify-between gap-3">
                        <Link to="/posts/$postId" params={{ postId: p.id }} className="text-sm font-medium line-clamp-1 hover:underline">
                          {p.title || p.body.slice(0, 80) || "Untitled"}
                        </Link>
                        <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                          {p.reactions} ♥ · {p.comments} 💬
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Users className="size-4" /> Recently active members</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin/members">All members <ArrowRight className="size-4 ml-1" /></Link>
                </Button>
              </CardHeader>
              <CardContent>
                {active.length === 0 ? (
                  <EmptyState icon={<Users className="size-5" />} title="No member activity yet" />
                ) : (
                  <ul className="divide-y">
                    {active.map((m) => (
                      <li key={m.id} className="flex items-center justify-between py-2.5">
                        <Link to="/admin/members/$userId" params={{ userId: m.id }} className="text-sm font-medium hover:underline truncate">
                          {m.full_name || m.email || "Member"}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {m.last_active_at ? new Date(m.last_active_at).toLocaleDateString() : "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
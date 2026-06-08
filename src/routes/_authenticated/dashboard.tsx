import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardCard, EmptyState } from "@/components/app/DashboardCard";
import { SpaceCard } from "@/components/app/SpaceCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { Collection, Space } from "@/lib/spaces";
import { Users2, MessageSquare, Calendar, UserCircle2, Bookmark, ArrowRight, Bell, Trophy, Award, CreditCard } from "lucide-react";
import { fetchMembers, type MemberSummary } from "@/lib/members";
import { MemberCard } from "@/components/members/MemberCard";
import { ContinueLearningCard, SuggestedCoursesCard } from "@/components/courses/ContinueLearningCard";
import { supabase as sb } from "@/integrations/supabase/client";
import type { Course, Lesson, LessonProgress } from "@/lib/courses";
import { UpcomingEventsWidget } from "@/components/events/UpcomingEventsWidget";
import { NotificationSummaryCard } from "@/components/notifications/NotificationSummaryCard";
import { WelcomeChecklistWidget } from "@/components/onboarding/WelcomeChecklistWidget";
import { SuggestedMembersCard } from "@/components/onboarding/SuggestedMembersCard";
import { PointsDisplay } from "@/components/gamification/PointsDisplay";
import { fetchUserPointsTotal } from "@/lib/gamification";
import { ActivePollsWidget } from "@/components/feed/ActivePollsWidget";
import { UnansweredQuestionsWidget } from "@/components/feed/UnansweredQuestionsWidget";
import { TrendingHashtagsCard } from "@/components/feed/TrendingHashtagsCard";
import { UpgradePromptCard } from "@/components/access/UpgradePromptCard";
import { AccessSummaryCard } from "@/components/access/AccessSummaryCard";
import { fetchMyGrants, type AccessGrant } from "@/lib/access";
import { fetchMySubscription } from "@/lib/billing";
import { fetchPlan } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [memberRows, setMemberRows] = useState<{ space_id: string; user_id: string }[]>([]);
  const [continueData, setContinueData] = useState<{ course: Course; lesson: Lesson; total: number; completed: number } | null>(null);
  const [newestMembers, setNewestMembers] = useState<MemberSummary[]>([]);
  const [myPoints, setMyPoints] = useState(0);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [planName, setPlanName] = useState<string | null>(null);

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

  useEffect(() => {
    (async () => {
      const m = await fetchMembers();
      setNewestMembers(m.filter((x) => x.status === "active").slice(0, 4));
    })();
  }, []);

  useEffect(() => { if (user) fetchUserPointsTotal(user.id).then(setMyPoints); }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [g, s] = await Promise.all([fetchMyGrants(user.id), fetchMySubscription(user.id)]);
      setGrants(g);
      if (s?.plan_id) {
        const p = await fetchPlan(s.plan_id);
        setPlanName(p?.name ?? null);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: prog } = await sb.from("lesson_progress").select("*").eq("user_id", user.id).order("last_viewed_at", { ascending: false });
      const progress = (prog ?? []) as LessonProgress[];
      const incomplete = progress.find((p) => p.status !== "completed");
      if (!incomplete) return setContinueData(null);
      const { data: l } = await sb.from("lessons").select("*").eq("id", incomplete.lesson_id).maybeSingle();
      if (!l) return setContinueData(null);
      const { data: c } = await sb.from("courses").select("*").eq("id", l.course_id).maybeSingle();
      if (!c) return setContinueData(null);
      const { data: courseLessons } = await sb.from("lessons").select("id").eq("course_id", l.course_id);
      const total = (courseLessons ?? []).length;
      const courseLessonIds = new Set((courseLessons ?? []).map((x) => x.id));
      const completed = progress.filter((p) => p.status === "completed" && courseLessonIds.has(p.lesson_id)).length;
      setContinueData({ course: c as Course, lesson: l as Lesson, total, completed });
    })();
  }, [user]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    memberRows.forEach((r) => m.set(r.space_id, (m.get(r.space_id) ?? 0) + 1));
    return m;
  }, [memberRows]);
  const mySpaces = useMemo(() => new Set(memberRows.filter((r) => r.user_id === user?.id).map((r) => r.space_id)), [memberRows, user]);
  const collectionsById = useMemo(() => new Map(collections.map((c) => [c.id, c])), [collections]);

  const featured = spaces.slice(0, 4);

  const cards = [
    { title: "Saved Resources", icon: <Bookmark className="size-4" />, msg: "Bookmarks and downloads." },
  ];
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in your community today.</p>
      </header>

      <WelcomeChecklistWidget />

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

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="size-5" />Latest Discussions</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/feed">Open feed <ArrowRight className="size-4 ml-1" /></Link>
          </Button>
        </div>
        <DashboardCard title="Community Feed" icon={<MessageSquare className="size-4" />}>
          <p className="text-sm text-muted-foreground">
            Catch up on the newest posts, questions, and announcements across the Spaces you've joined.
          </p>
          <div className="mt-3">
            <Button size="sm" asChild><Link to="/feed">View community feed</Link></Button>
          </div>
        </DashboardCard>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Calendar className="size-5" />Upcoming Events</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/events">All events <ArrowRight className="size-4 ml-1" /></Link>
          </Button>
        </div>
        <UpcomingEventsWidget limit={3} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2"><UserCircle2 className="size-5" />Newest Members</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/members">All members <ArrowRight className="size-4 ml-1" /></Link>
          </Button>
        </div>
        {newestMembers.length === 0 ? (
          <EmptyState icon={<UserCircle2 className="size-5" />} title="No members yet" description="As people join, they'll appear here." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {newestMembers.map((m) => <MemberCard key={m.id} member={m} />)}
          </div>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NotificationSummaryCard />
        <AccessSummaryCard grants={grants} planName={planName} />
        <ActivePollsWidget />
        <UnansweredQuestionsWidget />
        <TrendingHashtagsCard />
        <DashboardCard title="My Points" icon={<Trophy className="size-4" />}>
          <div className="flex items-center justify-between">
            <PointsDisplay points={myPoints} size="lg" />
            <Button size="sm" variant="outline" asChild><Link to="/achievements"><Award className="size-4 mr-1" />My achievements</Link></Button>
          </div>
          <div className="mt-3">
            <Button size="sm" variant="ghost" asChild><Link to="/leaderboard">View leaderboard <ArrowRight className="size-4 ml-1" /></Link></Button>
          </div>
        </DashboardCard>
        <SuggestedMembersCard />
        <DashboardCard title="Membership" icon={<CreditCard className="size-4" />}>
          <p className="text-sm"><span className="text-muted-foreground">Current plan:</span> <span className="font-medium">Free Member</span></p>
          <p className="text-xs text-muted-foreground mt-1">Upgrade Coming Soon — full checkout activates in a later phase.</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" asChild><Link to="/plans">View plans <ArrowRight className="size-4 ml-1" /></Link></Button>
            <Button size="sm" variant="ghost" asChild><Link to="/pricing">Pricing</Link></Button>
          </div>
        </DashboardCard>
        <DashboardCard title="Saved Content" icon={<Bookmark className="size-4" />}>
          <p className="text-sm text-muted-foreground">Quickly return to posts, lessons, events, and resources you've saved.</p>
          <div className="mt-3">
            <Button size="sm" variant="outline" asChild><Link to="/saved">Open Saved <ArrowRight className="size-4 ml-1" /></Link></Button>
          </div>
        </DashboardCard>
        {cards.map((c) => (
          <DashboardCard key={c.title} title={c.title} icon={c.icon} comingSoon>
            <p className="text-sm text-muted-foreground">{c.msg}</p>
          </DashboardCard>
        ))}
      </div>

      <UpgradePromptCard />
    </div>
  );
}
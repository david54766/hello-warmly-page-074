import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AdminStatCard, DashboardCard, EmptyState } from "@/components/app/DashboardCard";
import { Users, UserPlus, Activity, Settings, Users2, GraduationCap, Calendar, CreditCard, Bot, Sparkles, FolderTree, Plus, ArrowRight, MessageSquare, Shield, CalendarCheck, UserX, BarChart3, ShieldAlert, ListChecks, Award, Trophy, Star, Tag, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getIcon, type Space } from "@/lib/spaces";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, newWeek: 0, active: 0, spaces: 0, collections: 0, events: 0, upcomingEvents: 0, rsvps: 0, suspended: 0, newMonth: 0, openReports: 0, totalPlans: 0, activePlans: 0, featuredPlan: "—", billingConfigured: false });
  const [recent, setRecent] = useState<Space[]>([]);

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/dashboard" });
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
      const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString();
      const nowIso = new Date().toISOString();
      const [{ count: total }, { count: newWeek }, { count: active }, { count: spacesCount }, { count: collectionsCount }, { data: recentSpaces }, { count: eventsCount }, { count: upcomingCount }, { count: rsvpCount }, { count: suspended }, { count: newMonth }, { count: openReports }, { data: plansData }, { data: billingData }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("last_active_at", weekAgo),
        supabase.from("spaces").select("*", { count: "exact", head: true }).eq("is_archived", false),
        supabase.from("collections").select("*", { count: "exact", head: true }),
        supabase.from("spaces").select("*").order("created_at", { ascending: false }).limit(5),
        (supabase as any).from("events").select("*", { count: "exact", head: true }),
        (supabase as any).from("events").select("*", { count: "exact", head: true }).gte("end_time", nowIso),
        (supabase as any).from("event_rsvps").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "suspended"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", monthAgo),
        supabase.from("reports").select("*", { count: "exact", head: true }).in("status", ["open", "under_review", "pending"]),
        (supabase as any).from("plans").select("name,active,featured"),
        (supabase as any).from("billing_settings").select("stripe_publishable_key").limit(1).maybeSingle(),
      ]);
      const plans = (plansData ?? []) as { name: string; active: boolean; featured: boolean }[];
      setStats({
        total: total ?? 0,
        newWeek: newWeek ?? 0,
        active: active ?? 0,
        spaces: spacesCount ?? 0,
        collections: collectionsCount ?? 0,
        events: eventsCount ?? 0,
        upcomingEvents: upcomingCount ?? 0,
        rsvps: rsvpCount ?? 0,
        suspended: suspended ?? 0,
        newMonth: newMonth ?? 0,
        openReports: openReports ?? 0,
        totalPlans: plans.length,
        activePlans: plans.filter((p) => p.active).length,
        featuredPlan: plans.find((p) => p.featured)?.name ?? "—",
        billingConfigured: !!billingData?.stripe_publishable_key,
      });
      setRecent((recentSpaces ?? []) as Space[]);
    })();
  }, [isAdmin]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Platform Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage members, settings, content, engagement, and platform growth from one central dashboard.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild><Link to="/admin/spaces"><Plus className="size-4 mr-1.5" />Create Space</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/collections"><Plus className="size-4 mr-1.5" />Create Collection</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/members"><Users className="size-4 mr-2" />Manage Members</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/events"><Calendar className="size-4 mr-2" />Events</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/posts"><MessageSquare className="size-4 mr-2" />Posts</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/moderation"><Shield className="size-4 mr-2" />Moderation</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/analytics"><BarChart3 className="size-4 mr-2" />Analytics</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/checklist"><ListChecks className="size-4 mr-2" />Onboarding</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/badges"><Award className="size-4 mr-2" />Badges</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/points"><Trophy className="size-4 mr-2" />Points</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/plans"><CreditCard className="size-4 mr-2" />Plans</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/billing-settings"><CreditCard className="size-4 mr-2" />Billing</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/subscribers"><Users className="size-4 mr-2" />Subscribers</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/transactions"><CreditCard className="size-4 mr-2" />Transactions</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/payment-events"><Activity className="size-4 mr-2" />Payment Events</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/access"><Shield className="size-4 mr-2" />Access</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/bundles"><CreditCard className="size-4 mr-2" />Bundles</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/coupons"><Tag className="size-4 mr-2" />Coupons</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/trials"><Clock className="size-4 mr-2" />Trials</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/revenue"><BarChart3 className="size-4 mr-2" />Revenue</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/settings"><Settings className="size-4 mr-2" />Settings</Link></Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Total Members" value={stats.total} icon={<Users className="size-4 text-muted-foreground" />} />
        <AdminStatCard label="New Members (30d)" value={stats.newMonth} icon={<UserPlus className="size-4 text-muted-foreground" />} />
        <AdminStatCard label="Active Members (7d)" value={stats.active} icon={<Activity className="size-4 text-muted-foreground" />} />
        <AdminStatCard label="Suspended" value={stats.suspended} icon={<UserX className="size-4 text-muted-foreground" />} />
        <AdminStatCard label="Total Spaces" value={stats.spaces} icon={<Users2 className="size-4 text-muted-foreground" />} />
        <AdminStatCard label="Collections" value={stats.collections} icon={<FolderTree className="size-4 text-muted-foreground" />} />
        <AdminStatCard label="Total Events" value={stats.events} icon={<Calendar className="size-4 text-muted-foreground" />} />
        <AdminStatCard label="Upcoming Events" value={stats.upcomingEvents} icon={<CalendarCheck className="size-4 text-muted-foreground" />} />
        <AdminStatCard label="Open Reports" value={stats.openReports} icon={<ShieldAlert className="size-4 text-muted-foreground" />} />
        <AdminStatCard label="Total Plans" value={stats.totalPlans} icon={<CreditCard className="size-4 text-muted-foreground" />} />
        <AdminStatCard label="Active Plans" value={stats.activePlans} icon={<CreditCard className="size-4 text-muted-foreground" />} />
        <AdminStatCard label="Featured Plan" value={stats.featuredPlan} icon={<Star className="size-4 text-muted-foreground" />} />
        <AdminStatCard label="Billing Setup" value={stats.billingConfigured ? "Ready" : "Pending"} icon={<CreditCard className="size-4 text-muted-foreground" />} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recently created Spaces</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/spaces">Manage all <ArrowRight className="size-4 ml-1" /></Link>
          </Button>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            icon={<Users2 className="size-5" />}
            title="No Spaces yet"
            description="Create your first Space to get started."
            action={<Button asChild><Link to="/admin/spaces"><Plus className="size-4 mr-1.5" />Create Space</Link></Button>}
          />
        ) : (
          <ul className="space-y-2">
            {recent.map((s) => {
              const Icon = getIcon(s.icon);
              return (
                <li key={s.id}>
                  <Card className="rounded-2xl">
                    <CardContent className="pt-5 flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center"><Icon className="size-5" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{s.name}</p>
                        {s.tagline && <p className="text-sm text-muted-foreground line-clamp-1">{s.tagline}</p>}
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/admin/spaces/$spaceId" params={{ spaceId: s.id }}>Manage</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Platform areas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { t: "Courses", i: <GraduationCap className="size-4" /> },
            { t: "Payments", i: <CreditCard className="size-4" /> },
            { t: "Automations", i: <Bot className="size-4" /> },
            { t: "AI Assistant", i: <Sparkles className="size-4" /> },
          ].map((x) => (
            <DashboardCard key={x.t} title={x.t} icon={x.i} comingSoon>
              <p className="text-sm text-muted-foreground">Management tools will appear here.</p>
            </DashboardCard>
          ))}
        </div>
      </section>
    </div>
  );
}
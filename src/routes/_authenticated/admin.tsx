import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AdminStatCard, DashboardCard } from "@/components/app/DashboardCard";
import { Users, UserPlus, Activity, Settings, Users2, GraduationCap, Calendar, CreditCard, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, newWeek: 0, active: 0 });

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/dashboard" });
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
      const [{ count: total }, { count: newWeek }, { count: active }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("last_active_at", weekAgo),
      ]);
      setStats({ total: total ?? 0, newWeek: newWeek ?? 0, active: active ?? 0 });
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
        <Button asChild>
          <Link to="/admin/settings"><Settings className="size-4 mr-2" />Platform settings</Link>
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard label="Total Members" value={stats.total} icon={<Users className="size-4 text-muted-foreground" />} />
        <AdminStatCard label="New Members (7d)" value={stats.newWeek} icon={<UserPlus className="size-4 text-muted-foreground" />} />
        <AdminStatCard label="Active Members (7d)" value={stats.active} icon={<Activity className="size-4 text-muted-foreground" />} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Platform areas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { t: "Spaces", i: <Users2 className="size-4" /> },
            { t: "Courses", i: <GraduationCap className="size-4" /> },
            { t: "Events", i: <Calendar className="size-4" /> },
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
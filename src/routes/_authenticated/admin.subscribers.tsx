import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchAllSubscriptions, type Subscription, type SubscriptionStatus } from "@/lib/billing";
import { fetchAllPlans, type Plan } from "@/lib/plans";
import { supabase } from "@/integrations/supabase/client";
import { AdminSubscriberTable, type SubscriberRow } from "@/components/billing/AdminSubscriberTable";

export const Route = createFileRoute("/_authenticated/admin/subscribers")({ component: Page });

const FILTERS: { value: SubscriptionStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "trialing", label: "Trialing" },
  { value: "past_due", label: "Past due" },
  { value: "canceled", label: "Canceled" },
  { value: "incomplete", label: "Incomplete" },
];

function Page() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { email: string | null; full_name: string | null }>>({});
  const [filter, setFilter] = useState<SubscriptionStatus | "all">("all");

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [s, p] = await Promise.all([fetchAllSubscriptions(), fetchAllPlans()]);
      setSubs(s); setPlans(p);
      const ids = Array.from(new Set(s.map((x) => x.user_id)));
      if (ids.length) {
        const { data } = await supabase.from("profiles").select("id,email,full_name").in("id", ids);
        const map: Record<string, { email: string | null; full_name: string | null }> = {};
        (data ?? []).forEach((p: any) => { map[p.id] = { email: p.email, full_name: p.full_name }; });
        setProfiles(map);
      }
    })();
  }, [isAdmin]);

  const rows: SubscriberRow[] = useMemo(() => {
    const planMap = new Map(plans.map((p) => [p.id, p]));
    return subs
      .filter((s) => filter === "all" || s.status === filter)
      .map((s) => ({
        subscription: s,
        plan: s.plan_id ? planMap.get(s.plan_id) ?? null : null,
        email: profiles[s.user_id]?.email ?? null,
        full_name: profiles[s.user_id]?.full_name ?? null,
      }));
  }, [subs, plans, profiles, filter]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Subscribers</h1>
        <p className="text-muted-foreground mt-1">All members with subscription records.</p>
      </header>
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          {FILTERS.map((f) => <TabsTrigger key={f.value} value={f.value}>{f.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold">{rows.length} subscriber{rows.length === 1 ? "" : "s"}</h2></CardHeader>
        <CardContent><AdminSubscriberTable rows={rows} /></CardContent>
      </Card>
    </div>
  );
}
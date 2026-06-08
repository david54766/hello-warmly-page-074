import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllTrials, type TrialRecord, type TrialStatus } from "@/lib/trials";
import { fetchAllPlans } from "@/lib/plans";
import { AdminTrialTable } from "@/components/trials/AdminTrialTable";

export const Route = createFileRoute("/_authenticated/admin/trials")({ component: Page });

const FILTERS: { value: TrialStatus | "all"; label: string }[] = [
  { value: "all", label: "All" }, { value: "active", label: "Active" },
  { value: "converted", label: "Converted" }, { value: "expired", label: "Expired" }, { value: "canceled", label: "Canceled" },
];

function Page() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [trials, setTrials] = useState<TrialRecord[]>([]);
  const [members, setMembers] = useState<Record<string, string>>({});
  const [plans, setPlans] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<TrialStatus | "all">("all");

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [t, p] = await Promise.all([fetchAllTrials(), fetchAllPlans()]);
      setTrials(t);
      setPlans(Object.fromEntries(p.map((x) => [x.id, x.name])));
      const ids = Array.from(new Set(t.map((x) => x.user_id)));
      if (ids.length) {
        const { data } = await supabase.from("profiles").select("id,email,full_name").in("id", ids);
        const map: Record<string, string> = {};
        (data ?? []).forEach((r: any) => { map[r.id] = r.full_name || r.email || "—"; });
        setMembers(map);
      }
    })();
  }, [isAdmin]);

  const filtered = useMemo(() => trials.filter((t) => filter === "all" || t.status === filter), [trials, filter]);
  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Trials</h1>
        <p className="text-muted-foreground mt-1">Active, converted, expired, and canceled trial records.</p>
      </header>
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>{FILTERS.map((f) => <TabsTrigger key={f.value} value={f.value}>{f.label}</TabsTrigger>)}</TabsList>
      </Tabs>
      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold">{filtered.length} trial{filtered.length === 1 ? "" : "s"}</h2></CardHeader>
        <CardContent><AdminTrialTable rows={filtered} members={members} plans={plans} /></CardContent>
      </Card>
    </div>
  );
}
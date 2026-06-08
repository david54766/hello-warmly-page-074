import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/DashboardCard";
import { AlertTriangle } from "lucide-react";

interface Row {
  user_id: string; full_name: string | null; email: string | null;
  inactive_14d: boolean; onboarding_incomplete: boolean; past_due: boolean; trial_ending_soon: boolean;
  active_warnings: number; post_count: number; status: string;
}

export function AtRiskMemberTable({ limit = 10 }: { limit?: number }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("at_risk_members")
        .select("*")
        .or("inactive_14d.eq.true,past_due.eq.true,trial_ending_soon.eq.true,active_warnings.gte.1,onboarding_incomplete.eq.true")
        .limit(limit);
      setRows((data ?? []) as Row[]);
    })();
  }, [limit]);

  if (!rows) return <Skeleton className="h-24 rounded-lg" />;
  if (rows.length === 0) return <EmptyState icon={<AlertTriangle className="size-5" />} title="No at-risk members" description="Everyone looks healthy." />;

  return (
    <div className="rounded-xl border divide-y">
      {rows.map((r) => {
        const tags: string[] = [];
        if (r.inactive_14d) tags.push("inactive 14d+");
        if (r.onboarding_incomplete) tags.push("onboarding");
        if (r.past_due) tags.push("past due");
        if (r.trial_ending_soon) tags.push("trial ending");
        if (r.active_warnings > 0) tags.push(`${r.active_warnings} warning${r.active_warnings > 1 ? "s" : ""}`);
        if (r.post_count === 0) tags.push("no posts");
        return (
          <Link key={r.user_id} to="/admin/members/$userId" params={{ userId: r.user_id }} className="flex flex-wrap items-center justify-between gap-3 p-3 hover:bg-muted/40">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{r.full_name || r.email || "Member"}</p>
              <p className="text-xs text-muted-foreground truncate">{r.email}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => <span key={t} className="text-[10px] uppercase tracking-wide rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5">{t}</span>)}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
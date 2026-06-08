import { useEffect, useState } from "react";
import { listAudit, type AuditLog, type AuditFilters } from "@/lib/audit";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/DashboardCard";
import { History } from "lucide-react";
import { AuditLogDetailModal } from "./AuditLogDetailModal";
import { supabase } from "@/integrations/supabase/client";

export function AuditLogTable({ filters, limit = 100 }: { filters?: AuditFilters; limit?: number }) {
  const [rows, setRows] = useState<AuditLog[] | null>(null);
  const [actors, setActors] = useState<Map<string, string>>(new Map());
  const [open, setOpen] = useState<AuditLog | null>(null);

  useEffect(() => {
    listAudit(filters ?? {}, limit).then(async (r) => {
      setRows(r);
      const ids = Array.from(new Set(r.map((x) => x.actor_id).filter(Boolean) as string[]));
      if (ids.length) {
        const { data } = await supabase.from("profiles").select("id,full_name,email").in("id", ids);
        setActors(new Map((data ?? []).map((p: any) => [p.id, p.full_name || p.email || "—"])));
      }
    }).catch(() => setRows([]));
  }, [JSON.stringify(filters), limit]);

  if (!rows) return <Skeleton className="h-24 rounded-lg" />;
  if (rows.length === 0) return <EmptyState icon={<History className="size-5" />} title="No activity" description="Admin actions will appear here." />;

  return (
    <>
      <div className="rounded-xl border divide-y">
        {rows.map((l) => (
          <button key={l.id} onClick={() => setOpen(l)} className="w-full flex flex-wrap items-center justify-between gap-3 p-3 text-left hover:bg-muted/40">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{l.action_type.replace(/_/g, " ")}</span>
              {l.target_type && <span className="text-xs text-muted-foreground">→ {l.target_type}</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{l.actor_id ? actors.get(l.actor_id) ?? "—" : "system"}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{new Date(l.created_at).toLocaleString()}</span>
            </div>
          </button>
        ))}
      </div>
      <AuditLogDetailModal log={open} actorName={open?.actor_id ? actors.get(open.actor_id) ?? null : null} onClose={() => setOpen(null)} />
    </>
  );
}
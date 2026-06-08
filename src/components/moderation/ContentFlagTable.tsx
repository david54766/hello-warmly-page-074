import { useEffect, useState } from "react";
import { listFlags, type ContentFlag, type FlagStatus } from "@/lib/moderation";
import { SeverityPill } from "./SeverityPill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentFlagDetailModal } from "./ContentFlagDetailModal";
import { EmptyState } from "@/components/app/DashboardCard";
import { Flag } from "lucide-react";

export function ContentFlagTable({ status }: { status?: FlagStatus }) {
  const [rows, setRows] = useState<ContentFlag[] | null>(null);
  const [open, setOpen] = useState<ContentFlag | null>(null);

  const load = () => listFlags(status).then(setRows).catch(() => setRows([]));
  useEffect(() => { load(); }, [status]);

  if (!rows) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;
  if (rows.length === 0) return <EmptyState icon={<Flag className="size-5" />} title="No flags" description="Flagged content will appear here." />;

  return (
    <>
      <div className="rounded-xl border divide-y">
        {rows.map((f) => (
          <button key={f.id} onClick={() => setOpen(f)} className="w-full flex flex-wrap items-center justify-between gap-3 p-3 text-left hover:bg-muted/40">
            <div className="flex items-center gap-3 min-w-0">
              <SeverityPill severity={f.severity} />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{f.target_type}</span>
              <span className="text-sm truncate">{f.flag_type.replace("_", " ")}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs capitalize text-muted-foreground">{f.status.replace("_"," ")}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{new Date(f.created_at).toLocaleDateString()}</span>
            </div>
          </button>
        ))}
      </div>
      <ContentFlagDetailModal flag={open} onClose={() => setOpen(null)} onChanged={load} />
    </>
  );
}
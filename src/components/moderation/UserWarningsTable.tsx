import { useEffect, useState } from "react";
import { listWarnings, type UserWarning } from "@/lib/moderation";
import { WarningStatusPill } from "./WarningStatusPill";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/DashboardCard";
import { ShieldAlert } from "lucide-react";

export function UserWarningsTable({ userId }: { userId?: string }) {
  const [rows, setRows] = useState<UserWarning[] | null>(null);
  useEffect(() => { listWarnings(userId).then(setRows).catch(() => setRows([])); }, [userId]);
  if (!rows) return <Skeleton className="h-24 rounded-lg" />;
  if (rows.length === 0) return <EmptyState icon={<ShieldAlert className="size-5" />} title="No warnings" description="No warnings issued." />;
  return (
    <div className="rounded-xl border divide-y">
      {rows.map((w) => (
        <div key={w.id} className="p-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{w.warning_type.replace("_"," ")}</span>
              <WarningStatusPill status={w.status} />
            </div>
            <p className="text-sm mt-1 line-clamp-2">{w.reason}</p>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">{new Date(w.issued_at).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TRIAL_STATUS_LABELS, type TrialRecord, type TrialStatus } from "@/lib/trials";

const VARIANT: Record<TrialStatus, string> = {
  active: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  converted: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  expired: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  canceled: "bg-muted text-muted-foreground border-border",
};

export function AdminTrialTable({ rows, members, plans }: {
  rows: TrialRecord[];
  members?: Record<string, string>;
  plans?: Record<string, string>;
}) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground py-4">No trial records yet.</p>;
  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead>Member</TableHead><TableHead>Plan</TableHead><TableHead>Started</TableHead><TableHead>Ends</TableHead><TableHead>Status</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {rows.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="text-sm">{members?.[t.user_id] ?? t.user_id.slice(0, 8)}</TableCell>
            <TableCell className="text-sm">{t.plan_id ? plans?.[t.plan_id] ?? "—" : "—"}</TableCell>
            <TableCell className="text-sm">{new Date(t.starts_at).toLocaleDateString()}</TableCell>
            <TableCell className="text-sm">{new Date(t.ends_at).toLocaleDateString()}</TableCell>
            <TableCell><Badge variant="outline" className={`rounded-full ${VARIANT[t.status]}`}>{TRIAL_STATUS_LABELS[t.status]}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
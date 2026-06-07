import { type PointsEntry, SOURCE_LABELS } from "@/lib/gamification";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function PointsLedgerTable({ rows, showUser = false, userNames }: { rows: PointsEntry[]; showUser?: boolean; userNames?: Map<string, string> }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No points activity yet.</p>;
  return (
    <div className="rounded-2xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {showUser && <TableHead>Member</TableHead>}
            <TableHead>When</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-right">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              {showUser && <TableCell className="text-sm">{userNames?.get(r.user_id) ?? r.user_id.slice(0, 8)}</TableCell>}
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</TableCell>
              <TableCell className="text-sm">{SOURCE_LABELS[r.source_type] ?? r.source_type}</TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">{r.reason ?? "—"}</TableCell>
              <TableCell className={`text-right font-medium ${r.points < 0 ? "text-destructive" : ""}`}>{r.points > 0 ? "+" : ""}{r.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
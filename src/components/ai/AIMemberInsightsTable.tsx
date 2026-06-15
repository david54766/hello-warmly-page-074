import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ENGAGEMENT_LABELS, RISK_LABELS, type AIMemberInsight } from "@/lib/memberAi";
import { Link } from "@tanstack/react-router";

export function AIMemberInsightsTable({ insights }: { insights: AIMemberInsight[] }) {
  if (insights.length === 0) {
    return <div className="text-sm text-muted-foreground py-12 text-center">No insights generated yet.</div>;
  }
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Member</TableHead><TableHead>Engagement</TableHead><TableHead>Risk</TableHead>
          <TableHead>Suggested action</TableHead><TableHead>Generated</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {insights.map((i) => (
            <TableRow key={i.id}>
              <TableCell>
                <Link to="/admin/members/$userId" params={{ userId: i.user_id }} className="text-primary hover:underline text-sm font-mono">
                  {i.user_id.slice(0, 8)}…
                </Link>
              </TableCell>
              <TableCell><Badge variant="outline">{ENGAGEMENT_LABELS[i.engagement_level]}</Badge></TableCell>
              <TableCell><Badge variant={i.risk_level === "high" ? "destructive" : "outline"}>{RISK_LABELS[i.risk_level]}</Badge></TableCell>
              <TableCell className="text-sm max-w-xs truncate">{i.suggested_actions_json[0] ?? "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/plans";

export interface TxnRow {
  id: string;
  kind: "purchase" | "checkout_session" | "invoice";
  date: string;
  amount: number | null;
  currency: string;
  status: string;
  member: string;
  reference: string | null;
}

export function AdminTransactionTable({ rows }: { rows: TxnRow[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No transactions yet.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Kind</TableHead>
          <TableHead>Member</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Reference</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.kind + r.id}>
            <TableCell>{new Date(r.date).toLocaleString()}</TableCell>
            <TableCell className="capitalize">{r.kind.replace("_", " ")}</TableCell>
            <TableCell>{r.member}</TableCell>
            <TableCell>{r.amount !== null ? formatPrice(Number(r.amount), r.currency) : "—"}</TableCell>
            <TableCell><Badge variant="outline" className="rounded-full capitalize">{r.status}</Badge></TableCell>
            <TableCell className="text-xs text-muted-foreground truncate max-w-[180px]">{r.reference ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
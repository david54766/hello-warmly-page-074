import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/plans";
import { PURCHASE_STATUS_LABELS, type Purchase } from "@/lib/billing";

export function PurchaseHistoryTable({ purchases }: { purchases: Purchase[] }) {
  if (purchases.length === 0) {
    return <p className="text-sm text-muted-foreground">No purchases yet.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Reference</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {purchases.map((p) => (
          <TableRow key={p.id}>
            <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
            <TableCell className="capitalize">{p.purchase_type.replace("_", " ")}</TableCell>
            <TableCell>{formatPrice(Number(p.amount), p.currency)}</TableCell>
            <TableCell><Badge variant="outline" className="rounded-full">{PURCHASE_STATUS_LABELS[p.status]}</Badge></TableCell>
            <TableCell className="text-xs text-muted-foreground truncate max-w-[180px]">{p.stripe_payment_intent_id ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText } from "lucide-react";
import { formatPrice } from "@/lib/plans";
import { INVOICE_STATUS_LABELS, type Invoice } from "@/lib/billing";

export function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return <p className="text-sm text-muted-foreground">No invoices yet.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Amount due</TableHead>
          <TableHead>Amount paid</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((inv) => (
          <TableRow key={inv.id}>
            <TableCell>{new Date(inv.created_at).toLocaleDateString()}</TableCell>
            <TableCell>{formatPrice(Number(inv.amount_due), inv.currency)}</TableCell>
            <TableCell>{formatPrice(Number(inv.amount_paid), inv.currency)}</TableCell>
            <TableCell><Badge variant="outline" className="rounded-full">{INVOICE_STATUS_LABELS[inv.status]}</Badge></TableCell>
            <TableCell className="text-right space-x-2">
              {inv.hosted_invoice_url && (
                <Button size="sm" variant="ghost" asChild>
                  <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer"><ExternalLink className="size-4 mr-1" />View</a>
                </Button>
              )}
              {inv.invoice_pdf_url && (
                <Button size="sm" variant="ghost" asChild>
                  <a href={inv.invoice_pdf_url} target="_blank" rel="noreferrer"><FileText className="size-4 mr-1" />PDF</a>
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PaymentWebhookEvent } from "@/lib/billing";

export function PaymentEventTable({ events }: { events: PaymentWebhookEvent[] }) {
  const [open, setOpen] = useState<PaymentWebhookEvent | null>(null);
  if (events.length === 0) return <p className="text-sm text-muted-foreground">No webhook events recorded yet.</p>;
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Event type</TableHead>
            <TableHead>Stripe event ID</TableHead>
            <TableHead>Processed</TableHead>
            <TableHead>Error</TableHead>
            <TableHead className="text-right">Payload</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((e) => (
            <TableRow key={e.id}>
              <TableCell>{new Date(e.created_at).toLocaleString()}</TableCell>
              <TableCell className="font-medium">{e.event_type}</TableCell>
              <TableCell className="text-xs text-muted-foreground truncate max-w-[180px]">{e.stripe_event_id ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={e.processed ? "secondary" : "outline"} className="rounded-full">
                  {e.processed ? "Processed" : "Pending"}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-destructive truncate max-w-[180px]">{e.processing_error ?? "—"}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="ghost" onClick={() => setOpen(e)}>View</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{open?.event_type}</DialogTitle></DialogHeader>
          <pre className="bg-muted/40 rounded-lg p-4 text-xs overflow-auto max-h-[60vh]">
{JSON.stringify(open?.payload_json ?? {}, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </>
  );
}
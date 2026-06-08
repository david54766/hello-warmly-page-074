import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { SubscriptionStatusPill } from "./SubscriptionStatusPill";
import type { Subscription } from "@/lib/billing";
import type { Plan } from "@/lib/plans";

export interface SubscriberRow {
  subscription: Subscription;
  email: string | null;
  full_name: string | null;
  plan: Plan | null;
}

export function AdminSubscriberTable({ rows }: { rows: SubscriberRow[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No subscribers match these filters.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Renews</TableHead>
          <TableHead>Cancel at end</TableHead>
          <TableHead>Stripe IDs</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ subscription: s, email, full_name, plan }) => (
          <TableRow key={s.id}>
            <TableCell>
              <div className="font-medium">{full_name || "—"}</div>
              <div className="text-xs text-muted-foreground">{email}</div>
            </TableCell>
            <TableCell>{plan?.name ?? "—"}</TableCell>
            <TableCell><SubscriptionStatusPill status={s.status} /></TableCell>
            <TableCell>{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : "—"}</TableCell>
            <TableCell>{s.cancel_at_period_end ? "Yes" : "No"}</TableCell>
            <TableCell className="text-xs text-muted-foreground">
              <div className="truncate max-w-[140px]">{s.stripe_customer_id ?? "—"}</div>
              <div className="truncate max-w-[140px]">{s.stripe_subscription_id ?? "—"}</div>
            </TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="ghost" asChild>
                <Link to="/admin/members/$userId" params={{ userId: s.user_id }}>View</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
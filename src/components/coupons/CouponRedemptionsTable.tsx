import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CouponRedemption } from "@/lib/coupons";

export function CouponRedemptionsTable({ rows, members, coupons }: {
  rows: CouponRedemption[];
  members?: Record<string, string>;
  coupons?: Record<string, string>;
}) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground py-4">No redemptions yet.</p>;
  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead>Date</TableHead><TableHead>Coupon</TableHead><TableHead>Member</TableHead><TableHead>Discounted</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="text-sm">{new Date(r.redeemed_at).toLocaleString()}</TableCell>
            <TableCell className="font-mono text-sm">{coupons?.[r.coupon_id] ?? r.coupon_id.slice(0, 8)}</TableCell>
            <TableCell className="text-sm">{members?.[r.user_id] ?? r.user_id.slice(0, 8)}</TableCell>
            <TableCell className="text-sm">${Number(r.amount_discounted).toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
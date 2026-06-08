import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { COUPON_TARGET_LABELS, formatDiscount, isCouponExpired, isCouponMaxed, type Coupon } from "@/lib/coupons";

export function AdminCouponTable({ coupons, onEdit, onDelete, onToggle }: {
  coupons: Coupon[];
  onEdit: (c: Coupon) => void;
  onDelete: (c: Coupon) => void;
  onToggle: (c: Coupon) => void;
}) {
  if (coupons.length === 0) return <p className="text-sm text-muted-foreground py-4">No coupons yet.</p>;
  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Target</TableHead>
        <TableHead>Uses</TableHead><TableHead>Window</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {coupons.map((c) => {
          const expired = isCouponExpired(c); const maxed = isCouponMaxed(c);
          return (
            <TableRow key={c.id}>
              <TableCell className="font-mono font-semibold">{c.code}</TableCell>
              <TableCell>{formatDiscount(c)}</TableCell>
              <TableCell className="text-sm">{COUPON_TARGET_LABELS[c.applies_to_type]}</TableCell>
              <TableCell className="text-sm">{c.times_used}{c.max_uses ? ` / ${c.max_uses}` : ""}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {c.starts_at ? new Date(c.starts_at).toLocaleDateString() : "—"} → {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "∞"}
              </TableCell>
              <TableCell>
                {!c.active && <Badge variant="outline">Inactive</Badge>}
                {c.active && expired && <Badge variant="destructive">Expired</Badge>}
                {c.active && maxed && !expired && <Badge variant="destructive">Maxed</Badge>}
                {c.active && !expired && !maxed && <Badge className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" variant="outline">Active</Badge>}
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="ghost" onClick={() => onToggle(c)}>{c.active ? "Off" : "On"}</Button>
                <Button size="sm" variant="ghost" onClick={() => onEdit(c)}><Pencil className="size-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(c)} disabled={c.times_used > 0}><Trash2 className="size-4" /></Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
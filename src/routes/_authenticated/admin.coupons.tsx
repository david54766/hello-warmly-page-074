import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { deleteCoupon, fetchAllCoupons, fetchRedemptions, updateCoupon, type Coupon, type CouponRedemption } from "@/lib/coupons";
import { AdminCouponTable } from "@/components/coupons/AdminCouponTable";
import { CouponForm } from "@/components/coupons/CouponForm";
import { CouponRedemptionsTable } from "@/components/coupons/CouponRedemptionsTable";

export const Route = createFileRoute("/_authenticated/admin/coupons")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [redemptions, setRedemptions] = useState<CouponRedemption[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);
  const load = async () => {
    const [c, r] = await Promise.all([fetchAllCoupons(), fetchRedemptions()]);
    setCoupons(c); setRedemptions(r);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (!isAdmin) return null;
  const couponMap = Object.fromEntries(coupons.map((c) => [c.id, c.code]));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground mt-1">Create discount codes for memberships, bundles, courses, events, and premium Spaces.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4 mr-1.5" />New coupon</Button>
      </header>
      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold">{coupons.length} coupon{coupons.length === 1 ? "" : "s"}</h2></CardHeader>
        <CardContent>
          <AdminCouponTable
            coupons={coupons}
            onEdit={(c) => { setEditing(c); setOpen(true); }}
            onToggle={async (c) => { await updateCoupon(c.id, { active: !c.active }); toast.success("Updated"); load(); }}
            onDelete={async (c) => {
              if (!confirm(`Delete ${c.code}?`)) return;
              try { await deleteCoupon(c.id); toast.success("Deleted"); load(); }
              catch (e: any) { toast.error(e?.message ?? "Could not delete"); }
            }}
          />
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold">Redemption history</h2></CardHeader>
        <CardContent><CouponRedemptionsTable rows={redemptions} coupons={couponMap} /></CardContent>
      </Card>
      <CouponForm open={open} onOpenChange={setOpen} coupon={editing} onSaved={load} />
    </div>
  );
}
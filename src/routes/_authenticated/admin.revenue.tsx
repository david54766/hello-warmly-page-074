import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { fetchAllInvoices, fetchAllPurchases, fetchAllSubscriptions } from "@/lib/billing";
import { fetchRedemptions } from "@/lib/coupons";
import { RevenueAnalyticsCards, type RevenueStats } from "@/components/billing/RevenueAnalyticsCards";

export const Route = createFileRoute("/_authenticated/admin/revenue")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [subs, purchases, invoices, redemptions] = await Promise.all([
        fetchAllSubscriptions(), fetchAllPurchases(), fetchAllInvoices(), fetchRedemptions(),
      ]);
      const totalRevenue =
        purchases.filter((p) => p.status === "paid").reduce((a, p) => a + Number(p.amount), 0) +
        invoices.filter((i) => i.status === "paid").reduce((a, i) => a + Number(i.amount_paid), 0);
      setStats({
        totalRevenue, mrr: 0, arr: 0,
        activeSubscribers: subs.filter((s) => s.status === "active").length,
        trialing: subs.filter((s) => s.status === "trialing").length,
        pastDue: subs.filter((s) => s.status === "past_due").length,
        canceled: subs.filter((s) => s.status === "canceled").length,
        couponRedemptions: redemptions.length,
        oneTimePurchases: purchases.filter((p) => p.purchase_type === "one_time" && p.status === "paid").length,
      });
      setRecent([...purchases.slice(0, 5), ...invoices.slice(0, 5)]);
    })();
  }, [isAdmin]);

  if (!isAdmin || !stats) return null;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Revenue analytics</h1>
        <p className="text-muted-foreground mt-1">Totals, recurring revenue placeholders, and recent activity.</p>
      </header>
      <RevenueAnalyticsCards s={stats} />
      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold">Recent transactions</h2></CardHeader>
        <CardContent>
          {recent.length === 0 ? <p className="text-sm text-muted-foreground">No transactions yet.</p> : (
            <ul className="space-y-2 text-sm">
              {recent.map((r: any) => (
                <li key={r.id} className="flex justify-between rounded-lg border p-2">
                  <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  <span>${Number(r.amount ?? r.amount_paid ?? 0).toFixed(2)}</span>
                  <span className="capitalize">{r.status}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Star, Power, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { fetchAllPlans, deletePlan, updatePlan, createPlan, formatPrice, BILLING_INTERVAL_LABELS, type Plan } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/admin/plans/")({ component: AdminPlansPage });

function AdminPlansPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);
  const reload = async () => setPlans(await fetchAllPlans());
  useEffect(() => { if (isAdmin) reload(); }, [isAdmin]);
  if (!isAdmin) return null;

  const remove = async (p: Plan) => {
    if (!confirm(`Delete plan "${p.name}"? This cannot be undone.`)) return;
    try { await deletePlan(p.id); toast.success("Plan deleted"); reload(); }
    catch (err: any) { toast.error(err?.message ?? "Could not delete (plan may be in use)."); }
  };

  const move = async (p: Plan, dir: -1 | 1) => {
    const idx = plans.findIndex((x) => x.id === p.id);
    const swap = plans[idx + dir];
    if (!swap) return;
    await Promise.all([
      updatePlan(p.id, { sort_order: swap.sort_order }),
      updatePlan(swap.id, { sort_order: p.sort_order }),
    ]);
    reload();
  };

  const toggleFeatured = async (p: Plan) => {
    if (!p.featured) {
      // unfeature others
      await Promise.all(plans.filter((x) => x.featured && x.id !== p.id).map((x) => updatePlan(x.id, { featured: false })));
    }
    await updatePlan(p.id, { featured: !p.featured });
    reload();
  };

  const toggleActive = async (p: Plan) => {
    await updatePlan(p.id, { active: !p.active });
    reload();
  };

  const newPlan = async () => {
    const next = (Math.max(0, ...plans.map((p) => p.sort_order)) + 1);
    const created = await createPlan({ name: "New plan", description: "", price: 0, currency: "USD", billing_interval: "monthly", sort_order: next, active: false });
    navigate({ to: "/admin/plans/$planId", params: { planId: created.id } });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Plans</h1>
          <p className="text-muted-foreground mt-1">Define membership tiers, Stripe IDs, and access rules.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/admin/billing-settings"><CreditCard className="size-4 mr-1.5" />Billing settings</Link></Button>
          <Button onClick={newPlan}><Plus className="size-4 mr-1.5" />New plan</Button>
        </div>
      </header>

      <div className="space-y-2">
        {plans.map((p, i) => (
          <Card key={p.id} className="rounded-2xl">
            <CardContent className="pt-5 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{p.name}</p>
                  {p.featured && <Badge className="gap-1"><Star className="size-3" />Featured</Badge>}
                  {!p.active && <Badge variant="outline">Inactive</Badge>}
                  <Badge variant="secondary">{BILLING_INTERVAL_LABELS[p.billing_interval]}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {Number(p.price) === 0 ? "Free" : formatPrice(Number(p.price), p.currency)}
                  </span>
                </div>
                {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.description}</p>}
                {(p.stripe_product_id || p.stripe_price_id) && (
                  <p className="text-[11px] text-muted-foreground font-mono mt-1 truncate">
                    {p.stripe_product_id ?? "—"} / {p.stripe_price_id ?? "—"}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon" className="size-8" disabled={i === 0} onClick={() => move(p, -1)}><ArrowUp className="size-4" /></Button>
              <Button variant="ghost" size="icon" className="size-8" disabled={i === plans.length - 1} onClick={() => move(p, 1)}><ArrowDown className="size-4" /></Button>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => toggleFeatured(p)}><Star className={`size-4 ${p.featured ? "fill-current text-amber-500" : ""}`} /></Button>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => toggleActive(p)}><Power className={`size-4 ${p.active ? "text-emerald-600" : "text-muted-foreground"}`} /></Button>
              <Button variant="ghost" size="icon" className="size-8" asChild>
                <Link to="/admin/plans/$planId" params={{ planId: p.id }}><Pencil className="size-4" /></Link>
              </Button>
              <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => remove(p)}><Trash2 className="size-4" /></Button>
            </CardContent>
          </Card>
        ))}
        {plans.length === 0 && (
          <Card className="rounded-2xl">
            <CardContent className="pt-6 text-center text-sm text-muted-foreground">
              No plans yet. Create your first plan to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
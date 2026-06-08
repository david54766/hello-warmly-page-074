import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanCard } from "@/components/plans/PlanCard";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { AccessSummary } from "@/components/plans/AccessSummary";
import { fetchActivePlans, fetchAllPlanItems, TARGET_TYPE_LABELS, type Plan, type PlanItem } from "@/lib/plans";
import { CreditCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/plans")({
  component: PlansPage,
});

function PlansPage() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [items, setItems] = useState<PlanItem[]>([]);

  useEffect(() => {
    (async () => {
      const [p, i] = await Promise.all([fetchActivePlans(), fetchAllPlanItems()]);
      setPlans(p);
      setItems(i);
    })();
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Membership plans</h1>
        <p className="text-muted-foreground mt-1">Review your current plan and explore upgrade options.</p>
      </header>

      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center"><CreditCard className="size-5" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Your current plan</p>
                <p className="font-semibold">Free Member</p>
              </div>
            </div>
            <Badge variant="secondary">Coming soon</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Paid checkout will activate in a later phase. Browse upgrade options below.</p>
          <Button variant="outline" asChild><Link to="/pricing">View public pricing</Link></Button>
        </CardContent>
      </Card>

      {plans === null ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const planItems = items.filter((it) => it.plan_id === plan.id);
            const features = planItems.map((it) => TARGET_TYPE_LABELS[it.target_type]);
            const isFree = plan.billing_interval === "free" || Number(plan.price) === 0;
            return (
              <div key={plan.id} className="space-y-3">
                <PlanCard
                  plan={plan}
                  features={features.length > 0 ? features : ["Included community access"]}
                  ctaLabel={isFree ? "Current Free Plan" : undefined}
                  ctaSlot={isFree ? undefined : (
                    <CheckoutButton plan={plan} className="w-full" variant={plan.featured ? "default" : "outline"} />
                  )}
                />
                {planItems.length > 0 && (
                  <Card className="rounded-2xl">
                    <CardContent className="pt-5">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Includes</p>
                      <AccessSummary items={planItems} />
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
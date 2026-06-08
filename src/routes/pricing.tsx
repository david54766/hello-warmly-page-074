import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlanCard } from "@/components/plans/PlanCard";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchActivePlans, fetchAllPlanItems, TARGET_TYPE_LABELS, type Plan, type PlanItem } from "@/lib/plans";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Choose the membership that fits your goals | MemberHub" },
      { name: "description", content: "Start free or unlock premium courses, events, and member-only Spaces with a MemberHub plan." },
      { property: "og:title", content: "MemberHub Pricing" },
      { property: "og:description", content: "Choose the membership that fits your goals." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [items, setItems] = useState<PlanItem[]>([]);

  useEffect(() => {
    (async () => {
      const [p, i] = await Promise.all([fetchActivePlans(), fetchAllPlanItems()]);
      setPlans(p);
      setItems(i);
    })();
  }, []);

  const featuresFor = (plan: Plan): string[] => {
    const planItems = items.filter((it) => it.plan_id === plan.id);
    const base = planItems.map((it) => TARGET_TYPE_LABELS[it.target_type]);
    if (plan.billing_interval === "free") {
      return ["Public Spaces & community feed", "Free events & previews", ...base];
    }
    if (plan.name.toLowerCase().includes("vip")) {
      return ["Everything in Monthly", "Private VIP Space", "Priority support", ...base];
    }
    return ["All Free features", "Premium Spaces", "Full course library", "Member-only events", ...base];
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary grid place-items-center text-primary-foreground font-bold">M</div>
            <span className="font-semibold tracking-tight">MemberHub</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
            <Button asChild><Link to="/auth">Join</Link></Button>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-balance">
          Choose the membership that fits your goals.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Start with free access or unlock the full experience with premium courses, events, and member-only Spaces.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {plans === null ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const isFree = plan.billing_interval === "free" || Number(plan.price) === 0;
              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  features={featuresFor(plan)}
                  ctaTo={isFree ? "/auth" : undefined}
                  ctaLabel={isFree ? "Start Free" : undefined}
                  ctaSlot={isFree ? undefined : (
                    <CheckoutButton plan={plan} className="w-full" variant={plan.featured ? "default" : "outline"} />
                  )}
                />
              );
            })}
          </div>
        )}
        <p className="text-center text-xs text-muted-foreground mt-10">
          Checkout is coming soon. Plans currently shown for preview — no charges will occur.
        </p>
        <div className="text-center mt-6">
          <Button variant="ghost" asChild><Link to="/">Back home <ArrowRight className="size-4 ml-1" /></Link></Button>
        </div>
      </section>
    </main>
  );
}
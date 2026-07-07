import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/app/BrandLogo";
import { PlanCard } from "@/components/plans/PlanCard";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchActivePlans, fetchAllPlanItems, TARGET_TYPE_LABELS, type Plan, type PlanItem } from "@/lib/plans";
import { fetchActiveBundles, fetchBundleItems, type Bundle, type BundleItem } from "@/lib/access";
import { BundleCard } from "@/components/bundles/BundleCard";
import { ArrowRight, Package } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Choose the membership that fits your goals | Prima Donna Social" },
      { name: "description", content: "Start free or unlock premium courses, events, and member-only Spaces with a Prima Donna Social plan." },
      { property: "og:title", content: "Prima Donna Social Pricing" },
      { property: "og:description", content: "Choose the membership that fits your goals." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);

  useEffect(() => {
    (async () => {
      const [p, i, b, bi] = await Promise.all([
        fetchActivePlans(), fetchAllPlanItems(), fetchActiveBundles(), fetchBundleItems(),
      ]);
      setPlans(p);
      setItems(i);
      setBundles(b);
      setBundleItems(bi);
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
            <BrandLogo className="size-8 rounded-lg" />
            <span className="font-semibold tracking-tight">Prima Donna Social</span>
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

        {bundles.length > 0 && (
          <div className="mt-20">
            <div className="text-center mb-8">
              <div className="size-10 mx-auto rounded-xl bg-primary/10 text-primary grid place-items-center mb-3">
                <Package className="size-5" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Bundles</h2>
              <p className="text-muted-foreground mt-2">One-time purchases that unlock multiple items at once.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bundles.map((b) => (
                <BundleCard key={b.id} bundle={b} items={bundleItems.filter((it) => it.bundle_id === b.id)} />
              ))}
            </div>
            <div className="text-center mt-6">
              <Button variant="ghost" asChild><Link to="/bundles">All bundles <ArrowRight className="size-4 ml-1" /></Link></Button>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <Button variant="ghost" asChild><Link to="/">Back home <ArrowRight className="size-4 ml-1" /></Link></Button>
        </div>
      </section>
    </main>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BundleCard } from "@/components/bundles/BundleCard";
import { fetchActiveBundles, fetchBundleItems, type Bundle, type BundleItem } from "@/lib/access";
import { ArrowRight, Package } from "lucide-react";

export const Route = createFileRoute("/bundles")({
  head: () => ({
    meta: [
      { title: "Bundles — Unlock more with a single purchase | MemberHub" },
      { name: "description", content: "Save with curated MemberHub bundles that combine Spaces, courses, and events." },
      { property: "og:title", content: "MemberHub Bundles" },
      { property: "og:description", content: "Save with curated bundles of Spaces, courses, and events." },
    ],
  }),
  component: BundlesPage,
});

function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[] | null>(null);
  const [items, setItems] = useState<BundleItem[]>([]);

  useEffect(() => {
    (async () => {
      const [b, i] = await Promise.all([fetchActiveBundles(), fetchBundleItems()]);
      setBundles(b);
      setItems(i);
    })();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary grid place-items-center text-primary-foreground font-bold">M</div>
            <span className="font-semibold tracking-tight">MemberHub</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost"><Link to="/pricing">Pricing</Link></Button>
            <Button asChild><Link to="/auth">Join</Link></Button>
          </div>
        </div>
      </header>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="size-12 mx-auto rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4">
          <Package className="size-6" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-balance">Bundle up. Unlock more.</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Curated collections of Spaces, courses, and events — purchase once and keep lifetime access.
        </p>
      </section>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {bundles === null ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        ) : bundles.length === 0 ? (
          <p className="text-center text-muted-foreground">No bundles yet — check back soon.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bundles.map((b) => (
              <BundleCard
                key={b.id}
                bundle={b}
                items={items.filter((it) => it.bundle_id === b.id)}
              />
            ))}
          </div>
        )}
        <p className="text-center text-xs text-muted-foreground mt-10">
          Checkout activates when Stripe is configured. Bundles shown for preview — no charges yet.
        </p>
        <div className="text-center mt-6">
          <Button variant="ghost" asChild><Link to="/pricing">View plans <ArrowRight className="size-4 ml-1" /></Link></Button>
        </div>
      </section>
    </main>
  );
}
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { CreditCard, ExternalLink } from "lucide-react";
import { formatPrice, type Plan } from "@/lib/plans";
import { SubscriptionStatusPill } from "./SubscriptionStatusPill";
import { CustomerPortalButtonPlaceholder } from "./CustomerPortalButtonPlaceholder";
import type { Subscription } from "@/lib/billing";

export function BillingSummaryCard({ subscription, plan }: { subscription: Subscription | null; plan: Plan | null }) {
  const fmt = (s: string | null) => s ? new Date(s).toLocaleDateString() : "—";
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center"><CreditCard className="size-5" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Current plan</p>
            <p className="font-semibold">{plan?.name ?? "Free Member"}</p>
          </div>
          {subscription && <SubscriptionStatusPill status={subscription.status} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="font-medium">{plan ? formatPrice(Number(plan.price), plan.currency) : "Free"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Renews on</dt>
            <dd className="font-medium">{fmt(subscription?.current_period_end ?? null)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Cancel at period end</dt>
            <dd className="font-medium">{subscription?.cancel_at_period_end ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Trial ends</dt>
            <dd className="font-medium">{fmt(subscription?.trial_end ?? null)}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <CustomerPortalButtonPlaceholder />
          <Button variant="outline" size="sm" asChild>
            <Link to="/plans"><ExternalLink className="size-4 mr-1.5" />Change plan</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
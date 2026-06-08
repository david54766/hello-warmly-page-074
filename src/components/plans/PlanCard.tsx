import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { BILLING_INTERVAL_LABELS, formatPrice, type Plan } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface Props {
  plan: Plan;
  features?: string[];
  ctaLabel?: string;
  ctaTo?: string;
  onCta?: () => void;
  highlight?: boolean;
  footer?: ReactNode;
  showInactive?: boolean;
  ctaSlot?: ReactNode;
}

export function PlanCard({ plan, features, ctaLabel, ctaTo, onCta, highlight, footer, showInactive, ctaSlot }: Props) {
  const isFree = plan.billing_interval === "free" || Number(plan.price) === 0;
  const featured = highlight ?? plan.featured;

  return (
    <Card className={cn(
      "relative flex flex-col rounded-2xl transition-shadow",
      featured && "border-primary shadow-lg ring-1 ring-primary/30",
      !plan.active && "opacity-60",
    )}>
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="rounded-full px-3 gap-1"><Sparkles className="size-3" />Most popular</Badge>
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xl font-semibold">{plan.name}</h3>
          {showInactive && !plan.active && <Badge variant="outline">Inactive</Badge>}
        </div>
        {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-5 pt-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-semibold tracking-tight">
            {isFree ? "Free" : formatPrice(Number(plan.price), plan.currency)}
          </span>
          {!isFree && (
            <span className="text-sm text-muted-foreground">
              {BILLING_INTERVAL_LABELS[plan.billing_interval]}
            </span>
          )}
        </div>

        {features && features.length > 0 && (
          <ul className="space-y-2 text-sm">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="size-4 mt-0.5 text-primary shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto space-y-2">
          {ctaSlot ? (
            ctaSlot
          ) : ctaTo ? (
            <Button asChild variant={featured ? "default" : "outline"} className="w-full">
              <Link to={ctaTo}>{ctaLabel ?? "View Plan"}</Link>
            </Button>
          ) : (
            <Button variant={featured ? "default" : "outline"} className="w-full" onClick={onCta}>
              {ctaLabel ?? "Upgrade Coming Soon"}
            </Button>
          )}
          {footer}
        </div>
      </CardContent>
    </Card>
  );
}
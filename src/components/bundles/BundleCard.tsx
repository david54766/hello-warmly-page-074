import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Package, Sparkles } from "lucide-react";
import { formatPrice, TARGET_TYPE_LABELS } from "@/lib/plans";
import type { Bundle, BundleItem } from "@/lib/access";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function BundleCard({
  bundle, items, ctaSlot, footer, showInactive,
}: {
  bundle: Bundle;
  items: BundleItem[];
  ctaSlot?: ReactNode;
  footer?: ReactNode;
  showInactive?: boolean;
}) {
  const grouped = items.reduce<Record<string, number>>((acc, it) => {
    acc[it.target_type] = (acc[it.target_type] ?? 0) + 1;
    return acc;
  }, {});
  return (
    <Card className={cn("relative flex flex-col rounded-2xl", bundle.featured && "border-primary shadow-lg ring-1 ring-primary/30", !bundle.active && "opacity-60")}>
      {bundle.featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="rounded-full px-3 gap-1"><Sparkles className="size-3" />Featured bundle</Badge>
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center"><Package className="size-4" /></div>
            <h3 className="text-xl font-semibold">{bundle.name}</h3>
          </div>
          {showInactive && !bundle.active && <Badge variant="outline">Inactive</Badge>}
        </div>
        {bundle.description && <p className="text-sm text-muted-foreground">{bundle.description}</p>}
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-4 pt-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold tracking-tight">{formatPrice(Number(bundle.price), bundle.currency)}</span>
          <span className="text-sm text-muted-foreground">one-time</span>
        </div>
        <ul className="space-y-1.5 text-sm">
          {Object.entries(grouped).map(([t, n]) => (
            <li key={t} className="flex items-center gap-2">
              <Check className="size-4 text-primary" />
              <span>{n} {TARGET_TYPE_LABELS[t as keyof typeof TARGET_TYPE_LABELS]}{n > 1 ? "s" : ""}</span>
            </li>
          ))}
          {items.length === 0 && <li className="text-muted-foreground">No items added yet.</li>}
        </ul>
        <div className="mt-auto space-y-2">
          {ctaSlot ?? <Button variant={bundle.featured ? "default" : "outline"} className="w-full">Coming soon</Button>}
          {footer}
        </div>
      </CardContent>
    </Card>
  );
}
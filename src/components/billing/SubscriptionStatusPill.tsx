import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_STATUS_LABELS, type SubscriptionStatus } from "@/lib/billing";
import { cn } from "@/lib/utils";

const VARIANTS: Record<SubscriptionStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  trialing: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  past_due: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  canceled: "bg-muted text-muted-foreground border-border",
  incomplete: "bg-muted text-muted-foreground border-border",
  incomplete_expired: "bg-muted text-muted-foreground border-border",
  unpaid: "bg-destructive/15 text-destructive border-destructive/30",
  paused: "bg-muted text-muted-foreground border-border",
};

export function SubscriptionStatusPill({ status }: { status: SubscriptionStatus }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", VARIANTS[status])}>
      {SUBSCRIPTION_STATUS_LABELS[status]}
    </Badge>
  );
}
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function FinalEmptyState({
  headline = "Nothing here yet.",
  subtext = "Once activity starts, this area will fill with useful updates.",
  icon,
  ctaLabel = "Go back",
  ctaTo = "/dashboard",
  ctaAction,
}: {
  headline?: string;
  subtext?: string;
  icon?: ReactNode;
  ctaLabel?: string;
  ctaTo?: string;
  ctaAction?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        {icon ?? <Sparkles className="size-5" />}
      </div>
      <h3 className="text-lg font-semibold">{headline}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">{subtext}</p>
      <div className="mt-5">
        {ctaAction ?? (
          <Button asChild variant="outline">
            <Link to={ctaTo}>{ctaLabel}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
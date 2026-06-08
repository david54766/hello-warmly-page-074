import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Lock, Crown } from "lucide-react";

interface Props {
  title?: string;
  message?: string;
  variant?: "card" | "page";
  upgradeTo?: string;
}

export function LockedContentCard({
  title = "This content is part of a premium membership.",
  message = "Upgrade your access to unlock this Space, course, event, or resource.",
  variant = "card",
  upgradeTo = "/plans",
}: Props) {
  if (variant === "page") {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <Card className="rounded-2xl border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardContent className="pt-10 pb-8 text-center space-y-5">
            <div className="size-14 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto">
              <Crown className="size-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
              <p className="text-muted-foreground max-w-md mx-auto">{message}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Button asChild><Link to={upgradeTo}>Upgrade Access</Link></Button>
              <Button asChild variant="outline"><Link to="/pricing">View Plans</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <Card className="rounded-2xl border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardContent className="pt-5 flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
          <Lock className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" asChild><Link to={upgradeTo}>Upgrade</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function LockedContentPage(props: Omit<Props, "variant">) {
  return <LockedContentCard {...props} variant="page" />;
}
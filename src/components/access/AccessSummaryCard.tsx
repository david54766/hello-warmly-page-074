import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Lock, ShieldCheck } from "lucide-react";
import type { AccessGrant } from "@/lib/access";

export function AccessSummaryCard({ grants, planName }: { grants: AccessGrant[]; planName?: string | null }) {
  const active = grants.filter((g) => g.active);
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center"><ShieldCheck className="size-4" /></div>
            <h3 className="font-semibold">My access</h3>
          </div>
          <Badge variant="secondary">{planName ?? "Free"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3 pt-1">
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Lock className="size-4" />
          {active.length === 0
            ? "No premium grants yet."
            : `${active.length} premium grant${active.length === 1 ? "" : "s"} active.`}
        </p>
        <Button variant="outline" size="sm" asChild><Link to="/my-access">Open</Link></Button>
      </CardContent>
    </Card>
  );
}
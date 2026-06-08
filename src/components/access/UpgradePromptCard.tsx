import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function UpgradePromptCard({ headline, sub }: { headline?: string; sub?: string }) {
  return (
    <Card className="rounded-2xl border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
      <CardContent className="pt-5 flex flex-wrap items-center gap-4">
        <div className="size-10 rounded-xl bg-primary/15 text-primary grid place-items-center">
          <Sparkles className="size-5" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="font-semibold">{headline ?? "Unlock premium content"}</p>
          <p className="text-sm text-muted-foreground">{sub ?? "Upgrade to access paid Spaces, courses, events, and bundles."}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild><Link to="/plans">View plans</Link></Button>
          <Button variant="outline" asChild><Link to="/my-access">My access</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}
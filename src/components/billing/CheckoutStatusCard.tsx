import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";

export function CheckoutStatusCard({ variant }: { variant: "success" | "failed" }) {
  if (variant === "success") {
    return (
      <Card className="rounded-2xl border-emerald-200/60 dark:border-emerald-900/40 max-w-xl mx-auto">
        <CardContent className="pt-8 pb-8 text-center space-y-5">
          <div className="size-14 mx-auto rounded-full bg-emerald-500/15 text-emerald-600 grid place-items-center">
            <CheckCircle2 className="size-7" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">You're in.</h1>
            <p className="text-muted-foreground mt-2">Your membership is active and your content is ready.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild><Link to="/dashboard">Go to dashboard</Link></Button>
            <Button variant="outline" asChild><Link to="/billing">View billing</Link></Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="rounded-2xl border-destructive/30 max-w-xl mx-auto">
      <CardContent className="pt-8 pb-8 text-center space-y-5">
        <div className="size-14 mx-auto rounded-full bg-destructive/15 text-destructive grid place-items-center">
          <XCircle className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong with your payment.</h1>
          <p className="text-muted-foreground mt-2">Please try again or contact support if the issue continues.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild><Link to="/plans">Try again</Link></Button>
          <Button variant="outline" asChild><a href="mailto:support@example.com">Contact support</a></Button>
        </div>
      </CardContent>
    </Card>
  );
}
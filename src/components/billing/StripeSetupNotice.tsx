import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";

export function StripeSetupNotice({ isAdmin }: { isAdmin: boolean }) {
  return (
    <Card className="rounded-2xl border-amber-200/60 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40">
      <CardContent className="pt-5 flex gap-3 text-sm">
        <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold">Checkout setup required.</p>
          <p className="text-muted-foreground mt-1">
            Stripe checkout is ready to connect. Add your Stripe credentials in Billing Settings to activate live payments.
          </p>
          {isAdmin && (
            <div className="mt-3">
              <Button size="sm" asChild>
                <Link to="/admin/billing-settings">Open Billing Settings</Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
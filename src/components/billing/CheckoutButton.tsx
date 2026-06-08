import { useState, useEffect } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ctaForPlan, isStripeConfigured, startCheckout } from "@/lib/billing";
import type { Plan } from "@/lib/plans";

interface Props extends Omit<ButtonProps, "onClick" | "children"> {
  plan: Plan;
  label?: string;
}

export function CheckoutButton({ plan, label, ...rest }: Props) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { isStripeConfigured().then(setConfigured); }, []);

  const isFree = plan.billing_interval === "free" || Number(plan.price) === 0;
  const computed = label ?? ctaForPlan(plan, configured, isAdmin);

  const onClick = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (isFree) { navigate({ to: "/dashboard" }); return; }
    setLoading(true);
    try {
      const res = await startCheckout(plan, user.id);
      if (!res.configured) {
        toast.info("Checkout setup required", {
          description: isAdmin
            ? "Add Stripe credentials in Billing Settings to activate live payments."
            : "Live payments aren't activated yet. Please check back soon.",
        });
        return;
      }
      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        // Stripe wired but session creation pending later phase
        navigate({ to: "/checkout/success", search: { session: res.checkoutSessionId } as any });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={onClick} disabled={loading} {...rest}>
      {loading ? "Starting…" : computed}
    </Button>
  );
}
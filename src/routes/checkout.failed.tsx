import { createFileRoute } from "@tanstack/react-router";
import { CheckoutStatusCard } from "@/components/billing/CheckoutStatusCard";

export const Route = createFileRoute("/checkout/failed")({
  component: () => (
    <div className="min-h-screen grid place-items-center p-6">
      <CheckoutStatusCard variant="failed" />
    </div>
  ),
});
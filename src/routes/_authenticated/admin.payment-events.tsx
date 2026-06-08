import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { fetchAllWebhookEvents, type PaymentWebhookEvent } from "@/lib/billing";
import { PaymentEventTable } from "@/components/billing/PaymentEventTable";

export const Route = createFileRoute("/_authenticated/admin/payment-events")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<PaymentWebhookEvent[]>([]);
  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);
  useEffect(() => { if (isAdmin) fetchAllWebhookEvents().then(setEvents); }, [isAdmin]);
  if (!isAdmin) return null;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Payment events</h1>
        <p className="text-muted-foreground mt-1">Stripe webhook events received by the platform.</p>
      </header>
      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold">{events.length} event{events.length === 1 ? "" : "s"}</h2></CardHeader>
        <CardContent><PaymentEventTable events={events} /></CardContent>
      </Card>
    </div>
  );
}
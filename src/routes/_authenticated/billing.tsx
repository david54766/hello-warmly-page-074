import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BillingSummaryCard } from "@/components/billing/BillingSummaryCard";
import { PurchaseHistoryTable } from "@/components/billing/PurchaseHistoryTable";
import { InvoiceTable } from "@/components/billing/InvoiceTable";
import { StripeSetupNotice } from "@/components/billing/StripeSetupNotice";
import { TrialStatusCard } from "@/components/trials/TrialStatusCard";
import { CustomerPortalPlaceholder } from "@/components/billing/CustomerPortalPlaceholder";
import { ChangePlanModal } from "@/components/billing/ChangePlanModal";
import { CancelSubscriptionModal } from "@/components/billing/CancelSubscriptionModal";
import {
  fetchMyInvoices, fetchMyPurchases, fetchMySubscription, isStripeConfigured,
  type Invoice, type Purchase, type Subscription,
} from "@/lib/billing";
import { fetchPlan, type Plan } from "@/lib/plans";
import { fetchActiveTrial, type TrialRecord } from "@/lib/trials";

export const Route = createFileRoute("/_authenticated/billing")({ component: BillingPage });

function BillingPage() {
  const { user, isAdmin } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [purchases, setPurchases] = useState<Purchase[] | null>(null);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [trial, setTrial] = useState<TrialRecord | null>(null);
  const [changeOpen, setChangeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [s, p, i, conf, t] = await Promise.all([
        fetchMySubscription(user.id),
        fetchMyPurchases(user.id),
        fetchMyInvoices(user.id),
        isStripeConfigured(),
        fetchActiveTrial(user.id),
      ]);
      setSub(s); setPurchases(p); setInvoices(i); setConfigured(conf); setTrial(t);
      if (s?.plan_id) setPlan(await fetchPlan(s.plan_id));
    })();
  }, [user]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your membership, invoices, and payment history.</p>
      </header>
      {!configured && <StripeSetupNotice isAdmin={isAdmin} />}
      <TrialStatusCard trial={trial} />
      <BillingSummaryCard subscription={sub} plan={plan} />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setChangeOpen(true)}>Change plan</Button>
        <Button variant="outline" onClick={() => setCancelOpen(true)} disabled={!sub}>Cancel membership</Button>
      </div>
      <CustomerPortalPlaceholder configured={configured} />
      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold">Purchase history</h2></CardHeader>
        <CardContent>{purchases === null ? <Skeleton className="h-24" /> : <PurchaseHistoryTable purchases={purchases} />}</CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold">Invoices</h2></CardHeader>
        <CardContent>{invoices === null ? <Skeleton className="h-24" /> : <InvoiceTable invoices={invoices} />}</CardContent>
      </Card>
      <ChangePlanModal open={changeOpen} onOpenChange={setChangeOpen} currentPlanId={sub?.plan_id ?? null} configured={configured} />
      <CancelSubscriptionModal open={cancelOpen} onOpenChange={setCancelOpen} configured={configured} />
    </div>
  );
}
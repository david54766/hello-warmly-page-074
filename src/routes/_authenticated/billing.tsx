import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BillingSummaryCard } from "@/components/billing/BillingSummaryCard";
import { PurchaseHistoryTable } from "@/components/billing/PurchaseHistoryTable";
import { InvoiceTable } from "@/components/billing/InvoiceTable";
import { StripeSetupNotice } from "@/components/billing/StripeSetupNotice";
import {
  fetchMyInvoices, fetchMyPurchases, fetchMySubscription, isStripeConfigured,
  type Invoice, type Purchase, type Subscription,
} from "@/lib/billing";
import { fetchPlan, type Plan } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/billing")({ component: BillingPage });

function BillingPage() {
  const { user, isAdmin } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [purchases, setPurchases] = useState<Purchase[] | null>(null);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [s, p, i, conf] = await Promise.all([
        fetchMySubscription(user.id),
        fetchMyPurchases(user.id),
        fetchMyInvoices(user.id),
        isStripeConfigured(),
      ]);
      setSub(s); setPurchases(p); setInvoices(i); setConfigured(conf);
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
      <BillingSummaryCard subscription={sub} plan={plan} />
      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold">Purchase history</h2></CardHeader>
        <CardContent>{purchases === null ? <Skeleton className="h-24" /> : <PurchaseHistoryTable purchases={purchases} />}</CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold">Invoices</h2></CardHeader>
        <CardContent>{invoices === null ? <Skeleton className="h-24" /> : <InvoiceTable invoices={invoices} />}</CardContent>
      </Card>
    </div>
  );
}
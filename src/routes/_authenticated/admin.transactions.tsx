import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchAllPurchases, fetchAllCheckoutSessions, fetchAllInvoices,
  type Purchase, type CheckoutSession, type Invoice,
} from "@/lib/billing";
import { AdminTransactionTable, type TxnRow } from "@/components/billing/AdminTransactionTable";

export const Route = createFileRoute("/_authenticated/admin/transactions")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sessions, setSessions] = useState<CheckoutSession[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [p, s, i] = await Promise.all([fetchAllPurchases(), fetchAllCheckoutSessions(), fetchAllInvoices()]);
      setPurchases(p); setSessions(s); setInvoices(i);
      const ids = Array.from(new Set([...p, ...s, ...i].map((x) => x.user_id)));
      if (ids.length) {
        const { data } = await supabase.from("profiles").select("id,email,full_name").in("id", ids);
        const map: Record<string, string> = {};
        (data ?? []).forEach((r: any) => { map[r.id] = r.full_name || r.email || "—"; });
        setProfiles(map);
      }
    })();
  }, [isAdmin]);

  const rows: TxnRow[] = useMemo(() => {
    const all: TxnRow[] = [
      ...purchases.map((p): TxnRow => ({
        id: p.id, kind: "purchase", date: p.created_at, amount: Number(p.amount), currency: p.currency,
        status: p.status, member: profiles[p.user_id] ?? "—", reference: p.stripe_payment_intent_id,
      })),
      ...sessions.map((s): TxnRow => ({
        id: s.id, kind: "checkout_session", date: s.created_at, amount: null, currency: "USD",
        status: s.status, member: profiles[s.user_id] ?? "—", reference: s.stripe_session_id,
      })),
      ...invoices.map((inv): TxnRow => ({
        id: inv.id, kind: "invoice", date: inv.created_at, amount: Number(inv.amount_paid), currency: inv.currency,
        status: inv.status, member: profiles[inv.user_id] ?? "—", reference: inv.stripe_invoice_id,
      })),
    ];
    return all.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [purchases, sessions, invoices, profiles]);

  if (!isAdmin) return null;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground mt-1">All purchases, checkout sessions, and invoices.</p>
      </header>
      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold">{rows.length} record{rows.length === 1 ? "" : "s"}</h2></CardHeader>
        <CardContent><AdminTransactionTable rows={rows} /></CardContent>
      </Card>
    </div>
  );
}
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { fetchBillingSettings, updateBillingSettings, createBillingSettings, type BillingSettings } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/admin/billing-settings")({ component: BillingSettingsPage });

function BillingSettingsPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [s, setS] = useState<BillingSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      let row = await fetchBillingSettings();
      if (!row) row = await createBillingSettings({ currency: "USD", tax_behavior: "exclusive" });
      setS(row);
    })();
  }, [isAdmin]);

  if (!isAdmin || !s) return null;

  const save = async () => {
    setSaving(true);
    try {
      await updateBillingSettings(s.id, {
        stripe_publishable_key: s.stripe_publishable_key,
        stripe_secret_key_placeholder: s.stripe_secret_key_placeholder,
        stripe_webhook_secret_placeholder: s.stripe_webhook_secret_placeholder,
        currency: s.currency,
        tax_behavior: s.tax_behavior,
        billing_support_email: s.billing_support_email,
      });
      toast.success("Billing settings saved");
    } catch (err: any) { toast.error(err?.message ?? "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Billing settings</h1>
        <p className="text-muted-foreground mt-1">Prepare Stripe configuration. Checkout activates in a later phase.</p>
      </header>

      <Card className="rounded-2xl border-amber-200/60 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40">
        <CardContent className="pt-5 flex gap-3 text-sm">
          <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Checkout and live payments will be activated in a later phase.</p>
            <p className="text-muted-foreground mt-1">
              This page prepares the platform for Stripe integration. Never paste real production secret keys here —
              they should be managed securely via environment variables / backend secrets.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold">Stripe keys (placeholders)</h2></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Stripe publishable key</Label>
            <Input placeholder="pk_test_..." value={s.stripe_publishable_key ?? ""} onChange={(e) => setS({ ...s, stripe_publishable_key: e.target.value })} />
            <p className="text-xs text-muted-foreground">Safe to expose to the browser.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Stripe secret key (placeholder, masked)</Label>
            <Input type="password" placeholder="sk_test_..." value={s.stripe_secret_key_placeholder ?? ""} onChange={(e) => setS({ ...s, stripe_secret_key_placeholder: e.target.value })} />
            <p className="text-xs text-muted-foreground">Placeholder only. Move real values to backend secrets before going live.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Stripe webhook secret (placeholder, masked)</Label>
            <Input type="password" placeholder="whsec_..." value={s.stripe_webhook_secret_placeholder ?? ""} onChange={(e) => setS({ ...s, stripe_webhook_secret_placeholder: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold">Defaults</h2></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Default currency</Label>
            <Input value={s.currency} maxLength={3} onChange={(e) => setS({ ...s, currency: e.target.value.toUpperCase() })} />
          </div>
          <div className="space-y-1.5">
            <Label>Tax behavior</Label>
            <Select value={s.tax_behavior} onValueChange={(v) => setS({ ...s, tax_behavior: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="exclusive">Exclusive (added at checkout)</SelectItem>
                <SelectItem value="inclusive">Inclusive (included in price)</SelectItem>
                <SelectItem value="unspecified">Unspecified</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Billing support email</Label>
            <Input type="email" value={s.billing_support_email ?? ""} onChange={(e) => setS({ ...s, billing_support_email: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
      </div>
    </div>
  );
}
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchPlan, fetchPlanItems, updatePlan, addPlanItem, deletePlanItem,
  TARGET_TYPE_LABELS, ACCESS_LEVEL_LABELS,
  type Plan, type PlanItem, type PlanAccessLevel, type PlanItemTargetType, type BillingInterval,
} from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/admin/plans/$planId")({ component: PlanBuilder });

type OptionRow = { id: string; name: string };

function PlanBuilder() {
  const { planId } = Route.useParams();
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [saving, setSaving] = useState(false);

  const [spaces, setSpaces] = useState<OptionRow[]>([]);
  const [courses, setCourses] = useState<OptionRow[]>([]);
  const [events, setEvents] = useState<OptionRow[]>([]);

  // new item form
  const [newTarget, setNewTarget] = useState<PlanItemTargetType>("platform");
  const [newId, setNewId] = useState<string>("");
  const [newAccess, setNewAccess] = useState<PlanAccessLevel>("full_access");

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);

  const reload = async () => {
    const [p, it] = await Promise.all([fetchPlan(planId), fetchPlanItems(planId)]);
    setPlan(p);
    setItems(it);
  };

  useEffect(() => { if (isAdmin) reload(); }, [isAdmin, planId]);

  useEffect(() => {
    (async () => {
      const [{ data: sp }, { data: co }, { data: ev }] = await Promise.all([
        supabase.from("spaces").select("id,name").order("name"),
        (supabase as any).from("courses").select("id,title").order("title"),
        (supabase as any).from("events").select("id,title").order("start_time", { ascending: false }),
      ]);
      setSpaces((sp ?? []).map((x: any) => ({ id: x.id, name: x.name })));
      setCourses((co ?? []).map((x: any) => ({ id: x.id, name: x.title })));
      setEvents((ev ?? []).map((x: any) => ({ id: x.id, name: x.title })));
    })();
  }, []);

  if (!isAdmin || !plan) return null;

  const save = async () => {
    setSaving(true);
    try {
      await updatePlan(plan.id, {
        name: plan.name,
        description: plan.description,
        price: Number(plan.price),
        currency: plan.currency,
        billing_interval: plan.billing_interval,
        stripe_product_id: plan.stripe_product_id || null,
        stripe_price_id: plan.stripe_price_id || null,
        trial_days: Number(plan.trial_days) || 0,
        featured: plan.featured,
        active: plan.active,
        sort_order: Number(plan.sort_order) || 0,
        access_rules_json: plan.access_rules_json,
      });
      toast.success("Plan saved");
    } catch (err: any) {
      toast.error(err?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const addItem = async () => {
    if (newTarget !== "platform" && newTarget !== "resource_placeholder" && !newId) {
      toast.error("Choose a target");
      return;
    }
    try {
      await addPlanItem({
        plan_id: plan.id,
        target_type: newTarget,
        target_id: newTarget === "platform" || newTarget === "resource_placeholder" ? null : newId,
        access_level: newAccess,
      });
      setNewId("");
      reload();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not add");
    }
  };

  const removeItem = async (id: string) => {
    try { await deletePlanItem(id); reload(); }
    catch (err: any) { toast.error(err?.message ?? "Could not remove"); }
  };

  const targetOptions = newTarget === "space" ? spaces : newTarget === "course" ? courses : newTarget === "event" ? events : [];
  const nameLookup = (id: string | null) => {
    if (!id) return null;
    return [...spaces, ...courses, ...events].find((x) => x.id === id)?.name ?? id.slice(0, 8);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Button variant="ghost" size="sm" asChild><Link to="/admin/plans"><ArrowLeft className="size-4 mr-1" />Back to plans</Link></Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight">{plan.name || "Untitled plan"}</h1>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Name</Label>
            <Input value={plan.name} onChange={(e) => setPlan({ ...plan, name: e.target.value })} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={3} value={plan.description ?? ""} onChange={(e) => setPlan({ ...plan, description: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Price</Label>
            <Input type="number" step="0.01" min="0" value={plan.price} onChange={(e) => setPlan({ ...plan, price: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Input value={plan.currency} onChange={(e) => setPlan({ ...plan, currency: e.target.value.toUpperCase() })} maxLength={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Billing interval</Label>
            <Select value={plan.billing_interval} onValueChange={(v) => setPlan({ ...plan, billing_interval: v as BillingInterval })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="one_time">One-time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Trial days (placeholder)</Label>
            <Input type="number" min="0" value={plan.trial_days} onChange={(e) => setPlan({ ...plan, trial_days: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label>Sort order</Label>
            <Input type="number" value={plan.sort_order} onChange={(e) => setPlan({ ...plan, sort_order: Number(e.target.value) })} />
          </div>
          <div className="flex items-center gap-6 sm:col-span-2 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={plan.featured} onCheckedChange={(v) => setPlan({ ...plan, featured: !!v })} />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={plan.active} onCheckedChange={(v) => setPlan({ ...plan, active: !!v })} />
              Active
            </label>
          </div>

          <div className="sm:col-span-2 space-y-1.5 pt-4 border-t border-border">
            <Label>Stripe product ID</Label>
            <Input placeholder="prod_..." value={plan.stripe_product_id ?? ""} onChange={(e) => setPlan({ ...plan, stripe_product_id: e.target.value })} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Stripe price ID</Label>
            <Input placeholder="price_..." value={plan.stripe_price_id ?? ""} onChange={(e) => setPlan({ ...plan, stripe_price_id: e.target.value })} />
            <p className="text-xs text-muted-foreground">Placeholder fields. Checkout is not active in this phase.</p>
          </div>

          <div className="sm:col-span-2 flex justify-end pt-2">
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save plan"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <h2 className="font-semibold">Access rules</h2>
          <p className="text-sm text-muted-foreground">Define what this plan unlocks.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No access rules yet.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((it) => (
                <li key={it.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="font-medium">{TARGET_TYPE_LABELS[it.target_type]}</span>
                  {it.target_id && <span className="text-muted-foreground">· {nameLookup(it.target_id)}</span>}
                  <span className="ml-auto text-xs rounded-full bg-muted px-2 py-0.5">{ACCESS_LEVEL_LABELS[it.access_level]}</span>
                  <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => removeItem(it.id)}><Trash2 className="size-4" /></Button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid gap-2 sm:grid-cols-4 pt-2 border-t border-border">
            <Select value={newTarget} onValueChange={(v) => { setNewTarget(v as PlanItemTargetType); setNewId(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="platform">Entire platform</SelectItem>
                <SelectItem value="space">Space</SelectItem>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="resource_placeholder">Resource (coming soon)</SelectItem>
              </SelectContent>
            </Select>
            {targetOptions.length > 0 ? (
              <Select value={newId} onValueChange={setNewId}>
                <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>
                  {targetOptions.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-xs text-muted-foreground self-center px-2">No specific target needed</div>
            )}
            <Select value={newAccess} onValueChange={(v) => setNewAccess(v as PlanAccessLevel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full_access">Full access</SelectItem>
                <SelectItem value="preview_access">Preview access</SelectItem>
                <SelectItem value="limited_access">Limited access</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addItem}><Plus className="size-4 mr-1" />Add</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
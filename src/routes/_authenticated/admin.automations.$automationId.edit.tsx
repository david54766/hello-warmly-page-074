import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { fetchAutomation, updateAutomation, type Automation, type AutomationAction, type AutomationCondition } from "@/lib/automations";
import { TriggerSelector } from "@/components/automations/TriggerSelector";
import { ConditionBuilder } from "@/components/automations/ConditionBuilder";
import { ActionBuilder } from "@/components/automations/ActionBuilder";
import { AutomationPreview } from "@/components/automations/AutomationPreview";
import { AutomationSafetyWarning } from "@/components/automations/AutomationSafetyWarning";

export const Route = createFileRoute("/_authenticated/admin/automations/$automationId/edit")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { automationId } = Route.useParams();
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("");
  const [conditions, setConditions] = useState<AutomationCondition[]>([]);
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [active, setActive] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const a = await fetchAutomation(automationId);
      if (!a) return;
      setAutomation(a);
      setName(a.name); setDescription(a.description ?? ""); setTriggerType(a.trigger_type);
      setConditions(a.conditions_json ?? []); setActions(a.actions_json ?? []); setActive(a.active);
    })();
  }, [isAdmin, automationId]);

  if (!isAdmin || !automation) return null;

  const save = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      await updateAutomation(automation.id, {
        name: name.trim(),
        description: description || null,
        trigger_type: triggerType,
        conditions_json: conditions as any,
        actions_json: actions as any,
        active,
      });
      toast.success("Saved");
      navigate({ to: "/admin/automations/$automationId", params: { automationId: automation.id } });
    } catch (e: any) { toast.error(e?.message ?? "Could not save"); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link to="/admin/automations/$automationId" params={{ automationId: automation.id }}><ArrowLeft className="size-4 mr-1" />Back</Link>
        </Button>
        <h1 className="text-3xl font-semibold tracking-tight">Edit automation</h1>
      </header>
      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold">Details</h2></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Description</Label><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <TriggerSelector value={triggerType} onChange={setTriggerType} />
        </CardContent>
      </Card>
      <Card className="rounded-2xl"><CardHeader><h2 className="font-semibold">Conditions</h2></CardHeader><CardContent><ConditionBuilder conditions={conditions} onChange={setConditions} /></CardContent></Card>
      <Card className="rounded-2xl"><CardHeader><h2 className="font-semibold">Actions</h2></CardHeader><CardContent><ActionBuilder actions={actions} onChange={setActions} /></CardContent></Card>
      <AutomationPreview automation={{ trigger_type: triggerType, conditions_json: conditions, actions_json: actions }} />
              <AutomationSafetyWarning automation={{ conditions_json: conditions, actions_json: actions }} />
      <Card className="rounded-2xl">
        <CardContent className="pt-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch checked={active} onCheckedChange={setActive} id="ed-active" />
            <Label htmlFor="ed-active">{active ? "Active" : "Inactive"}</Label>
          </div>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
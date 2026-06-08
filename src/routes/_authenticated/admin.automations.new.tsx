import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { createAutomation, type AutomationAction, type AutomationCondition } from "@/lib/automations";
import { AutomationBuilderStepper } from "@/components/automations/AutomationBuilderStepper";
import { TriggerSelector } from "@/components/automations/TriggerSelector";
import { ConditionBuilder } from "@/components/automations/ConditionBuilder";
import { ActionBuilder } from "@/components/automations/ActionBuilder";
import { AutomationPreview } from "@/components/automations/AutomationPreview";
import { AutomationSafetyWarning } from "@/components/automations/AutomationSafetyWarning";

export const Route = createFileRoute("/_authenticated/admin/automations/new")({ component: Page });

const STEPS = ["Trigger", "Conditions", "Actions", "Review"];

function Page() {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("");
  const [conditions, setConditions] = useState<AutomationCondition[]>([]);
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);
  if (!isAdmin) return null;

  const canNext = (step === 1 && !!triggerType) || step !== 1;

  const save = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!triggerType) { toast.error("Select a trigger"); return; }
    if (actions.length === 0) { toast.error("Add at least one action"); return; }
    setSaving(true);
    try {
      const a = await createAutomation({
        name: name.trim(),
        description: description || null,
        trigger_type: triggerType,
        conditions_json: conditions as any,
        actions_json: actions as any,
        active,
        created_by: user?.id ?? null,
      });
      toast.success("Automation created");
      navigate({ to: "/admin/automations/$automationId", params: { automationId: a.id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not create automation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">New automation</h1>
        <p className="text-muted-foreground mt-1">Build a rule in four quick steps.</p>
      </header>
      <AutomationBuilderStepper step={step} steps={STEPS} />
      <Card className="rounded-2xl">
        <CardHeader>
          <h2 className="font-semibold">{STEPS[step - 1]}</h2>
        </CardHeader>
        <CardContent className="space-y-5">
          {step === 1 && (
            <>
              <div className="grid gap-1.5">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Welcome new member" />
              </div>
              <div className="grid gap-1.5">
                <Label>Description</Label>
                <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this automation do?" />
              </div>
              <TriggerSelector value={triggerType} onChange={setTriggerType} />
            </>
          )}
          {step === 2 && <ConditionBuilder conditions={conditions} onChange={setConditions} />}
          {step === 3 && <ActionBuilder actions={actions} onChange={setActions} />}
          {step === 4 && (
            <div className="space-y-4">
              <AutomationPreview automation={{ trigger_type: triggerType, conditions_json: conditions, actions_json: actions }} />
              <AutomationSafetyWarning automation={{ conditions_json: conditions, actions_json: actions }} />
              <div className="flex items-center gap-2">
                <Switch checked={active} onCheckedChange={setActive} id="auto-active" />
                <Label htmlFor="auto-active">Activate immediately</Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => (step === 1 ? navigate({ to: "/admin/automations" }) : setStep(step - 1))}>
          <ArrowLeft className="size-4 mr-1.5" />{step === 1 ? "Cancel" : "Back"}
        </Button>
        {step < STEPS.length ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext}>Next<ArrowRight className="size-4 ml-1.5" /></Button>
        ) : (
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Create automation"}</Button>
        )}
      </div>
    </div>
  );
}
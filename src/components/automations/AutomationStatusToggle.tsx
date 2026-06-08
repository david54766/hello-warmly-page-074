import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { updateAutomation, type Automation } from "@/lib/automations";
import { toast } from "sonner";

interface Props {
  automation: Automation;
  onChange?: (active: boolean) => void;
}

export function AutomationStatusToggle({ automation, onChange }: Props) {
  const [active, setActive] = useState(automation.active);
  const [saving, setSaving] = useState(false);
  const toggle = async (v: boolean) => {
    setSaving(true);
    const prev = active;
    setActive(v);
    try {
      await updateAutomation(automation.id, { active: v });
      toast.success(v ? "Automation enabled" : "Automation disabled");
      onChange?.(v);
    } catch (e: any) {
      setActive(prev);
      toast.error(e?.message ?? "Could not update");
    } finally {
      setSaving(false);
    }
  };
  return <Switch checked={active} disabled={saving} onCheckedChange={toggle} aria-label="Toggle automation" />;
}
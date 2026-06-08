import { Label } from "@/components/ui/label";
import { TRIGGER_OPTIONS } from "@/lib/automations";

interface Props { value: string; onChange: (v: string) => void }

export function TriggerSelector({ value, onChange }: Props) {
  return (
    <div className="grid gap-1.5">
      <Label>Trigger</Label>
      <select
        className="h-9 border rounded-md px-2 text-sm bg-background"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select a trigger…</option>
        {TRIGGER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <p className="text-xs text-muted-foreground">Trigger options are placeholders. Full execution wiring ships in the next phase.</p>
    </div>
  );
}
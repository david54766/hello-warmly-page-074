import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { CONDITION_OPTIONS, type AutomationCondition } from "@/lib/automations";

interface Props {
  conditions: AutomationCondition[];
  onChange: (next: AutomationCondition[]) => void;
}

export function ConditionBuilder({ conditions, onChange }: Props) {
  const add = () => onChange([...conditions, { type: CONDITION_OPTIONS[0].value, value: "" }]);
  const remove = (i: number) => onChange(conditions.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<AutomationCondition>) =>
    onChange(conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Conditions (optional)</Label>
        <Button type="button" size="sm" variant="outline" onClick={add}><Plus className="size-3.5 mr-1" />Add condition</Button>
      </div>
      {conditions.length === 0 && (
        <p className="text-sm text-muted-foreground">No conditions. The automation will run for every matching trigger.</p>
      )}
      <div className="space-y-2">
        {conditions.map((c, i) => {
          const opt = CONDITION_OPTIONS.find((o) => o.value === c.type);
          return (
            <div key={i} className="flex gap-2 items-center">
              <select
                className="h-9 border rounded-md px-2 text-sm bg-background flex-1"
                value={c.type}
                onChange={(e) => update(i, { type: e.target.value, value: "" })}
              >
                {CONDITION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {opt?.needsValue && (
                <Input
                  placeholder="Value"
                  className="flex-1"
                  value={c.value ?? ""}
                  onChange={(e) => update(i, { value: e.target.value })}
                />
              )}
              <Button type="button" size="sm" variant="ghost" onClick={() => remove(i)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
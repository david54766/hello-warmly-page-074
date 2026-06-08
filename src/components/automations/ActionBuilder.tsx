import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { ACTION_OPTIONS, type AutomationAction } from "@/lib/automations";

interface Props {
  actions: AutomationAction[];
  onChange: (next: AutomationAction[]) => void;
}

export function ActionBuilder({ actions, onChange }: Props) {
  const add = () => onChange([...actions, { type: ACTION_OPTIONS[0].value, value: "" }]);
  const remove = (i: number) => onChange(actions.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<AutomationAction>) =>
    onChange(actions.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Actions</Label>
        <Button type="button" size="sm" variant="outline" onClick={add}><Plus className="size-3.5 mr-1" />Add action</Button>
      </div>
      {actions.length === 0 && (
        <p className="text-sm text-muted-foreground">Add at least one action.</p>
      )}
      <div className="space-y-2">
        {actions.map((c, i) => {
          const opt = ACTION_OPTIONS.find((o) => o.value === c.type);
          return (
            <div key={i} className="flex gap-2 items-center">
              <select
                className="h-9 border rounded-md px-2 text-sm bg-background flex-1"
                value={c.type}
                onChange={(e) => update(i, { type: e.target.value, value: "" })}
              >
                {ACTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
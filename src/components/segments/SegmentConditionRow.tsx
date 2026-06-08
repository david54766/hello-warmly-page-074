import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { CONDITION_TYPES, type SegmentCondition } from "@/lib/segments";

interface Props {
  condition: SegmentCondition;
  onChange: (next: SegmentCondition) => void;
  onRemove: () => void;
}

export function SegmentConditionRow({ condition, onChange, onRemove }: Props) {
  const opt = CONDITION_TYPES.find((c) => c.value === condition.type);
  return (
    <div className="flex gap-2 items-center">
      <select
        className="h-9 border rounded-md px-2 text-sm bg-background flex-1"
        value={condition.type}
        onChange={(e) => onChange({ type: e.target.value, value: "" })}
      >
        {CONDITION_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      {condition.type !== "no_posts" && (
        <Input
          className="flex-1"
          placeholder={opt?.placeholder ?? "Value"}
          value={condition.value ?? ""}
          onChange={(e) => onChange({ ...condition, value: e.target.value })}
        />
      )}
      <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
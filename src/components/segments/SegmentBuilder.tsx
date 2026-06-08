import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { SegmentConditionRow } from "./SegmentConditionRow";
import { CONDITION_TYPES, type Segment, type SegmentCondition } from "@/lib/segments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  initial?: Partial<Segment>;
  saving?: boolean;
  onSubmit: (values: { name: string; description: string | null; conditions_json: SegmentCondition[]; match_mode: "all" | "any"; active: boolean }) => void;
}

export function SegmentBuilder({ initial, saving, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [conditions, setConditions] = useState<SegmentCondition[]>(initial?.conditions_json ?? []);
  const [matchMode, setMatchMode] = useState<"all" | "any">((initial?.match_mode as any) ?? "all");
  const [active, setActive] = useState(initial?.active ?? true);

  const add = () => setConditions([...conditions, { type: CONDITION_TYPES[0].value, value: "" }]);

  return (
    <Card className="rounded-2xl">
      <CardHeader><CardTitle>Segment details</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. VIP Members" />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes about who this targets." />
        </div>
        <div className="flex items-center gap-3">
          <Label>Match</Label>
          <select className="h-9 border rounded-md px-2 text-sm bg-background" value={matchMode} onChange={(e) => setMatchMode(e.target.value as any)}>
            <option value="all">All conditions (AND)</option>
            <option value="any">Any condition (OR)</option>
          </select>
          <label className="flex items-center gap-2 text-sm ml-4">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Conditions</Label>
            <Button type="button" size="sm" variant="outline" onClick={add}><Plus className="size-3.5 mr-1" />Add</Button>
          </div>
          {conditions.length === 0 && <p className="text-sm text-muted-foreground">No conditions yet. Add one to start targeting members.</p>}
          {conditions.map((c, i) => (
            <SegmentConditionRow
              key={i}
              condition={c}
              onChange={(next) => setConditions(conditions.map((x, idx) => idx === i ? next : x))}
              onRemove={() => setConditions(conditions.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button disabled={!name || saving} onClick={() => onSubmit({ name, description: description || null, conditions_json: conditions, match_mode: matchMode, active })}>
            {saving ? "Saving…" : "Save segment"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
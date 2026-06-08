import { CheckCircle2, XCircle } from "lucide-react";
import { conditionLabel, type AutomationCondition } from "@/lib/automations";

export function ConditionResultList({ rows }: { rows: { condition: AutomationCondition; passed: boolean }[] }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">No conditions — runs unconditionally.</p>;
  return (
    <ul className="space-y-1.5">
      {rows.map((r, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          {r.passed ? <CheckCircle2 className="size-4 text-green-600 mt-0.5" /> : <XCircle className="size-4 text-destructive mt-0.5" />}
          <span>
            <span className="font-medium">{conditionLabel(r.condition.type)}</span>
            {r.condition.value != null && r.condition.value !== "" && <span className="text-muted-foreground"> · {String(r.condition.value)}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
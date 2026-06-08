import { Badge } from "@/components/ui/badge";
import { ConditionResultList } from "./ConditionResultList";
import { ActionResultList } from "./ActionResultList";
import type { TestAutomationResult } from "@/lib/automations";

export function AutomationExecutionSummary({ result }: { result: TestAutomationResult }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Final status</span>
        <Badge variant={result.status === "success" ? "default" : result.status === "failed" ? "destructive" : "outline"}>{result.status}</Badge>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Conditions</p>
        <ConditionResultList rows={result.conditions ?? []} />
      </div>
      {result.all_conditions_passed && (
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Actions</p>
          <ActionResultList rows={result.actions ?? []} />
        </div>
      )}
    </div>
  );
}
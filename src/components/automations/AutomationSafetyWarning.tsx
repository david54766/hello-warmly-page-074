import { AlertTriangle } from "lucide-react";
import { automationSafetyWarnings, type Automation } from "@/lib/automations";

export function AutomationSafetyWarning({ automation }: { automation: Pick<Automation, "conditions_json" | "actions_json"> }) {
  const warnings = automationSafetyWarnings(automation);
  if (!warnings.length) return null;
  return (
    <div className="rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="size-4 text-amber-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Heads up</p>
          <ul className="mt-1 space-y-0.5 text-sm text-amber-800 dark:text-amber-300 list-disc pl-4">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
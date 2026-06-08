import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { actionLabel, type AutomationAction } from "@/lib/automations";

export function ActionResultList({ rows }: { rows: { action: AutomationAction; result: { status: string; message?: string } }[] }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">No actions executed.</p>;
  return (
    <ul className="space-y-1.5">
      {rows.map((r, i) => {
        const Icon = r.result.status === "success" ? CheckCircle2 : r.result.status === "failed" ? XCircle : MinusCircle;
        const color = r.result.status === "success" ? "text-green-600" : r.result.status === "failed" ? "text-destructive" : "text-muted-foreground";
        return (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Icon className={`size-4 mt-0.5 ${color}`} />
            <span>
              <span className="font-medium">{actionLabel(r.action.type)}</span>
              {r.action.value != null && r.action.value !== "" && <span className="text-muted-foreground"> · {String(r.action.value)}</span>}
              {r.result.message && <span className="text-xs text-muted-foreground block">{r.result.message}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { triggerLabel, conditionLabel, actionLabel, type Automation } from "@/lib/automations";

export function AutomationDetailCard({ automation }: { automation: Automation }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{automation.name}</h2>
            {automation.description && <p className="text-sm text-muted-foreground mt-1">{automation.description}</p>}
          </div>
          <Badge variant={automation.active ? "default" : "secondary"}>{automation.active ? "Active" : "Inactive"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="text-xs uppercase text-muted-foreground tracking-wide mb-1">Trigger</p>
          <p>{triggerLabel(automation.trigger_type)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground tracking-wide mb-1">Conditions</p>
          {automation.conditions_json.length === 0 ? (
            <p className="text-muted-foreground">None</p>
          ) : (
            <ul className="list-disc ml-5 space-y-0.5">
              {automation.conditions_json.map((c, i) => (
                <li key={i}>{conditionLabel(c.type)}{c.value ? ` — ${c.value}` : ""}</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground tracking-wide mb-1">Actions</p>
          {automation.actions_json.length === 0 ? (
            <p className="text-muted-foreground">None</p>
          ) : (
            <ul className="list-disc ml-5 space-y-0.5">
              {automation.actions_json.map((c, i) => (
                <li key={i}>{actionLabel(c.type)}{c.value ? ` — ${c.value}` : ""}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground pt-2 border-t">
          <div>Created: {new Date(automation.created_at).toLocaleString()}</div>
          <div>Updated: {new Date(automation.updated_at).toLocaleString()}</div>
          <div>Total runs: {automation.total_runs}</div>
          <div>Errors: {automation.error_count}</div>
        </div>
      </CardContent>
    </Card>
  );
}
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { triggerLabel, type AutomationLog } from "@/lib/automations";
import { ConditionResultList } from "./ConditionResultList";
import { ActionResultList } from "./ActionResultList";

interface Props {
  log: AutomationLog | null;
  automationName?: string;
  onOpenChange: (v: boolean) => void;
}

export function AutomationLogDetailModal({ log, automationName, onOpenChange }: Props) {
  return (
    <Dialog open={!!log} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Log details</DialogTitle></DialogHeader>
        {log && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{automationName ?? log.automation_id}</span>
              <Badge>{log.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Trigger: {triggerLabel(log.trigger_type)}</div>
              <div>User: {log.user_id ?? "—"}</div>
              {(log as any).source_type && <div>Source: {(log as any).source_type}</div>}
              {(log as any).source_id && <div className="truncate">Source id: {String((log as any).source_id).slice(0, 8)}</div>}
              <div className="col-span-2">When: {new Date(log.created_at).toLocaleString()}</div>
            </div>
            {log.error_message && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Error</p>
                <p className="text-destructive text-sm">{log.error_message}</p>
              </div>
            )}
            {Array.isArray((log.details_json as any)?.conditions) && (log.details_json as any).conditions.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Conditions</p>
                <ConditionResultList rows={(log.details_json as any).conditions} />
              </div>
            )}
            {Array.isArray((log.details_json as any)?.actions) && (log.details_json as any).actions.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Actions</p>
                <ActionResultList rows={(log.details_json as any).actions} />
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Raw details</p>
              <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-64">{JSON.stringify(log.details_json, null, 2)}</pre>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
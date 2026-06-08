import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AuditLog } from "@/lib/audit";

export function AuditLogDetailModal({ log, actorName, onClose }: { log: AuditLog | null; actorName: string | null; onClose: () => void }) {
  if (!log) return null;
  return (
    <Dialog open={!!log} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{log.action_type.replace(/_/g, " ")}</DialogTitle></DialogHeader>
        <div className="space-y-2 text-sm">
          <div><span className="text-muted-foreground">Actor:</span> {actorName ?? log.actor_id ?? "system"}</div>
          <div><span className="text-muted-foreground">Target:</span> {log.target_type ?? "—"} {log.target_id ? <code className="text-xs ml-1">{log.target_id}</code> : null}</div>
          <div><span className="text-muted-foreground">When:</span> {new Date(log.created_at).toLocaleString()}</div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Details</p>
            <pre className="text-xs rounded-lg bg-muted p-3 overflow-auto max-h-72">{JSON.stringify(log.details_json, null, 2)}</pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
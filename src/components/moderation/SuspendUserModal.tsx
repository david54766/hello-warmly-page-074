import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { suspendUser, reactivateUser } from "@/lib/moderation";
import { toast } from "sonner";

export function SuspendUserModal({ userId, currentStatus, open, onClose, onChanged }: { userId: string; currentStatus: string; open: boolean; onClose: () => void; onChanged?: () => void }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const isSuspended = currentStatus === "suspended";

  const run = async () => {
    setSaving(true);
    try {
      if (isSuspended) { await reactivateUser(userId); toast.success("User reactivated"); }
      else { if (!reason.trim()) { toast.error("Reason required"); setSaving(false); return; } await suspendUser(userId, reason.trim()); toast.success("User suspended"); }
      onChanged?.(); onClose();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isSuspended ? "Reactivate user" : "Suspend user"}</DialogTitle></DialogHeader>
        {!isSuspended && (
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for suspension (visible internally and in audit log)" rows={4} />
        )}
        {isSuspended && <p className="text-sm text-muted-foreground">Restore full access to this member?</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={isSuspended ? "default" : "destructive"} onClick={run} disabled={saving}>
            {isSuspended ? "Reactivate" : "Suspend"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
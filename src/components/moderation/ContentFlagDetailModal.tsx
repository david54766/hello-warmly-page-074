import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FLAG_SEVERITIES, FLAG_STATUSES, updateFlag, type ContentFlag } from "@/lib/moderation";
import { SeverityPill } from "./SeverityPill";
import { toast } from "sonner";

export function ContentFlagDetailModal({ flag, onClose, onChanged }: { flag: ContentFlag | null; onClose: () => void; onChanged?: () => void }) {
  const [severity, setSeverity] = useState(flag?.severity ?? "medium");
  const [status, setStatus] = useState(flag?.status ?? "open");
  const [notes, setNotes] = useState(flag?.notes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (flag) { setSeverity(flag.severity); setStatus(flag.status); setNotes(flag.notes ?? ""); }
  }, [flag]);

  if (!flag) return null;

  const save = async () => {
    setSaving(true);
    try {
      await updateFlag(flag.id, { severity: severity as any, status: status as any, notes });
      toast.success("Flag updated");
      onChanged?.();
      onClose();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={!!flag} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Flag · <SeverityPill severity={flag.severity} /></DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div><span className="text-muted-foreground">Target:</span> {flag.target_type} · <code className="text-xs">{flag.target_id}</code></div>
          <div><span className="text-muted-foreground">Type:</span> {flag.flag_type.replace("_"," ")}</div>
          <div><span className="text-muted-foreground">Created:</span> {new Date(flag.created_at).toLocaleString()}</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Severity</label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FLAG_SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FLAG_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Notes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Moderator notes…" rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { WARNING_TYPES, issueWarning, type WarningType } from "@/lib/moderation";
import { toast } from "sonner";

export function UserWarningModal({ userId, open, onClose, onIssued }: { userId: string; open: boolean; onClose: () => void; onIssued?: () => void }) {
  const [type, setType] = useState<WarningType>("general");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return;
    setSaving(true);
    try { await issueWarning(userId, type, reason.trim()); toast.success("Warning issued"); onIssued?.(); onClose(); setReason(""); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Issue a warning</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Warning type</label>
            <Select value={type} onValueChange={(v) => setType(v as WarningType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{WARNING_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace("_"," ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Reason</label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Explain the issue for the member…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !reason.trim()}>Issue warning</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { reportMessage } from "@/lib/chat";
import { toast } from "sonner";

export function ReportMessageModal({
  messageId,
  reporterId,
  onClose,
}: {
  messageId: string | null;
  reporterId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (messageId) setReason(""); }, [messageId]);

  const submit = async () => {
    if (!messageId || !reason.trim()) return;
    setBusy(true);
    try {
      await reportMessage(messageId, reporterId, reason.trim());
      toast.success("Report submitted. Moderators will review it.");
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to report");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!messageId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Report message</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Tell us why this message should be reviewed.</p>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="e.g. Spam, harassment, off-topic…"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !reason.trim()}>
            {busy && <Loader2 className="size-4 mr-1.5 animate-spin" />}Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
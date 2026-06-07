import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { manualAdjustPoints } from "@/lib/gamification";
import { fetchMembers, type MemberSummary } from "@/lib/members";

export function AwardPointsModal({ open, onOpenChange, defaultUserId, onDone }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultUserId?: string;
  onDone?: () => void;
}) {
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [userId, setUserId] = useState(defaultUserId ?? "");
  const [points, setPoints] = useState<number>(10);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!defaultUserId) fetchMembers().then(setMembers);
    setUserId(defaultUserId ?? "");
    setPoints(10);
    setReason("");
  }, [open, defaultUserId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return toast.error("Pick a member");
    if (!reason.trim()) return toast.error("Reason is required");
    if (!points) return toast.error("Points must not be 0");
    setBusy(true);
    try {
      await manualAdjustPoints(userId, points, reason.trim());
      toast.success(points > 0 ? "Points awarded" : "Points subtracted");
      onDone?.();
      onOpenChange(false);
    } catch (err: any) { toast.error(err?.message ?? "Could not adjust points"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Adjust points</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {!defaultUserId && (
            <div className="space-y-1.5">
              <Label>Member</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger><SelectValue placeholder="Pick a member" /></SelectTrigger>
                <SelectContent>
                  {members.slice(0, 200).map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name || m.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <Button type="button" variant={points > 0 ? "default" : "outline"} onClick={() => setPoints(Math.abs(points))}>Award</Button>
            <Button type="button" variant={points < 0 ? "default" : "outline"} onClick={() => setPoints(-Math.abs(points))}>Subtract</Button>
            <Input type="number" value={Math.abs(points)} onChange={(e) => setPoints((points < 0 ? -1 : 1) * Math.abs(Number(e.target.value) || 0))} />
          </div>
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="Why these points are being adjusted" required />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
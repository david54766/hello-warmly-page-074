import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { awardBadgeManual, fetchBadges, type Badge } from "@/lib/gamification";
import { fetchMembers, type MemberSummary } from "@/lib/members";

export function AwardBadgeModal({ open, onOpenChange, defaultUserId, onAwarded }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultUserId?: string;
  onAwarded?: () => void;
}) {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [userId, setUserId] = useState(defaultUserId ?? "");
  const [slug, setSlug] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchBadges(true).then(setBadges);
    if (!defaultUserId) fetchMembers().then(setMembers);
    setUserId(defaultUserId ?? "");
    setSlug("");
    setReason("");
  }, [open, defaultUserId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !slug || !user) return toast.error("Pick a member and a badge");
    setBusy(true);
    try {
      await awardBadgeManual(userId, slug, reason || null, user.id);
      toast.success("Badge awarded");
      onAwarded?.();
      onOpenChange(false);
    } catch (err: any) { toast.error(err?.message ?? "Could not award badge"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Award a badge</DialogTitle></DialogHeader>
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
          <div className="space-y-1.5">
            <Label>Badge</Label>
            <Select value={slug} onValueChange={setSlug}>
              <SelectTrigger><SelectValue placeholder="Pick a badge" /></SelectTrigger>
              <SelectContent>
                {badges.filter((b) => b.active).map((b) => (
                  <SelectItem key={b.id} value={b.slug}>{b.name} (+{b.points_value})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Reason (optional)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="Why this member earned it" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Awarding…" : "Award badge"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
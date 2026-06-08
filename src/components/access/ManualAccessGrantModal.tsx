import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { createGrant, type AccessTargetType } from "@/lib/access";
import { TARGET_TYPE_LABELS } from "@/lib/plans";
import { toast } from "sonner";

const db = supabase as any;

export function ManualAccessGrantModal({
  open, onOpenChange, userId, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  onSaved: () => void;
}) {
  const [targetType, setTargetType] = useState<AccessTargetType>("space");
  const [targetId, setTargetId] = useState<string>("");
  const [endsAt, setEndsAt] = useState<string>("");
  const [options, setOptions] = useState<{ id: string; label: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (targetType === "platform" || targetType === "resource_placeholder") {
      setOptions([]); setTargetId(""); return;
    }
    const table = targetType === "space" ? "spaces" : targetType === "course" ? "courses" : "events";
    const col = targetType === "space" ? "name" : "title";
    db.from(table).select(`id, ${col}`).order(col).limit(200).then(({ data }: any) => {
      setOptions((data ?? []).map((x: any) => ({ id: x.id, label: x[col] ?? "Untitled" })));
    });
  }, [targetType]);

  const save = async () => {
    if (targetType !== "platform" && !targetId) return toast.error("Pick a target");
    setBusy(true);
    try {
      await createGrant({
        user_id: userId,
        target_type: targetType,
        target_id: targetType === "platform" ? null : targetId,
        access_source: "manual",
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        active: true,
      });
      toast.success("Access granted");
      onSaved(); onOpenChange(false);
      setTargetId(""); setEndsAt("");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not grant access");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Grant access</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Target type</Label>
            <Select value={targetType} onValueChange={(v) => setTargetType(v as AccessTargetType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TARGET_TYPE_LABELS) as AccessTargetType[]).map((t) => (
                  <SelectItem key={t} value={t}>{TARGET_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {targetType !== "platform" && targetType !== "resource_placeholder" && (
            <div className="space-y-1.5">
              <Label>Target</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger><SelectValue placeholder="Choose an item" /></SelectTrigger>
                <SelectContent>
                  {options.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Ends at (optional)</Label>
            <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Granting…" : "Grant access"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
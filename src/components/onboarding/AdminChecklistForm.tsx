import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { upsertChecklistItem, type ChecklistActionType, type ChecklistItem, type ChecklistTargetType } from "@/lib/onboarding";

const ACTION_TYPES: ChecklistActionType[] = [
  "complete_profile","join_space","create_first_post","comment_on_post",
  "follow_member","rsvp_event","start_course","complete_lesson","update_notifications"
];
const TARGET_TYPES: ChecklistTargetType[] = ["profile","space","post","event","course","lesson","settings","member"];

export function AdminChecklistForm({ item, onDone, onCancel }: { item?: ChecklistItem | null; onDone: () => void; onCancel?: () => void }) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [action, setAction] = useState<ChecklistActionType>(item?.action_type ?? "complete_profile");
  const [target, setTarget] = useState<ChecklistTargetType | "">(item?.target_type ?? "");
  const [targetId, setTargetId] = useState(item?.target_id ?? "");
  const [sortOrder, setSortOrder] = useState(item?.sort_order ?? 0);
  const [active, setActive] = useState(item?.active ?? true);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      await upsertChecklistItem({
        id: item?.id,
        title: title.trim(),
        description: description.trim() || null,
        action_type: action,
        target_type: (target || null) as any,
        target_id: targetId.trim() || null,
        sort_order: Number(sortOrder) || 0,
        active,
      });
      toast.success(item ? "Checklist item updated" : "Checklist item created");
      onDone();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} maxLength={400} rows={3} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Action type</Label>
          <Select value={action} onValueChange={(v) => setAction(v as ChecklistActionType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((a) => <SelectItem key={a} value={a}>{a.replaceAll("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Target type</Label>
          <Select value={target || "none"} onValueChange={(v) => setTarget(v === "none" ? "" : (v as ChecklistTargetType))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {TARGET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Target ID (optional)</Label>
          <Input value={targetId ?? ""} onChange={(e) => setTargetId(e.target.value)} placeholder="UUID" />
        </div>
        <div className="space-y-1.5">
          <Label>Sort order</Label>
          <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl border px-3 py-2">
        <div>
          <div className="text-sm font-medium">Active</div>
          <div className="text-xs text-muted-foreground">Show this item in the welcome checklist.</div>
        </div>
        <Switch checked={active} onCheckedChange={setActive} />
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : item ? "Save changes" : "Create item"}</Button>
      </div>
    </form>
  );
}
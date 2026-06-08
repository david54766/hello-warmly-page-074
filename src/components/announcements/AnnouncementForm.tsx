import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnouncementTargetSelector } from "./AnnouncementTargetSelector";
import { DISPLAY_OPTIONS, type AdminAnnouncement, type AnnouncementDisplayType, type AnnouncementTargetType } from "@/lib/announcements";

interface Props {
  initial?: Partial<AdminAnnouncement>;
  saving?: boolean;
  onSubmit: (values: Partial<AdminAnnouncement>) => void;
}

export function AnnouncementForm({ initial, saving, onSubmit }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [target, setTarget] = useState<{ target_type: AnnouncementTargetType; target_id: string | null; target_role: string | null }>({
    target_type: (initial?.target_type as AnnouncementTargetType) ?? "all_members",
    target_id: initial?.target_id ?? null,
    target_role: initial?.target_role ?? null,
  });
  const [displayType, setDisplayType] = useState<AnnouncementDisplayType>((initial?.display_type as AnnouncementDisplayType) ?? "banner");
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduled_at ?? "");

  return (
    <Card className="rounded-2xl">
      <CardHeader><CardTitle>Announcement</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New course available" />
        </div>
        <div className="space-y-1.5">
          <Label>Body</Label>
          <Textarea rows={5} value={body ?? ""} onChange={(e) => setBody(e.target.value)} placeholder="Write your announcement message…" />
        </div>

        <AnnouncementTargetSelector {...target} onChange={setTarget} />

        <div className="space-y-1.5">
          <Label>Display</Label>
          <select className="h-9 border rounded-md px-2 text-sm bg-background w-full" value={displayType} onChange={(e) => setDisplayType(e.target.value as AnnouncementDisplayType)}>
            {DISPLAY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pinned</label>
          <div className="flex items-center gap-2">
            <Label htmlFor="sched" className="m-0">Schedule (placeholder)</Label>
            <Input id="sched" type="datetime-local" value={scheduledAt ?? ""} onChange={(e) => setScheduledAt(e.target.value)} className="w-auto" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            disabled={!title || saving}
            onClick={() => onSubmit({ title, body, ...target, display_type: displayType, pinned, scheduled_at: scheduledAt || null })}
          >
            {saving ? "Saving…" : "Save announcement"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
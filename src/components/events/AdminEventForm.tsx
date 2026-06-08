import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { sbEvents, EVENT_TYPE_LABELS, EVENT_STATUS_LABELS, VISIBILITY_LABELS, ACCESS_LABELS, type EventRow, type EventType, type EventVisibility, type EventAccess, type EventStatus } from "@/lib/events";
import type { Space } from "@/lib/spaces";
import { AccessStateSelect } from "@/components/access/AccessStateSelect";

type Draft = Partial<EventRow>;

export function AdminEventForm({
  initial,
  spaces,
  onSaved,
  userId,
}: {
  initial?: EventRow;
  spaces: Space[];
  onSaved: (e: EventRow) => void;
  userId: string;
}) {
  const [draft, setDraft] = useState<Draft>(
    initial ?? {
      title: "",
      description: "",
      event_type: "community_call",
      visibility: "space_members",
      access_level: "free",
      status: "draft",
      timezone: "UTC",
      space_id: spaces[0]?.id,
      start_time: new Date(Date.now() + 86400_000).toISOString().slice(0, 16),
      end_time: new Date(Date.now() + 86400_000 + 3600_000).toISOString().slice(0, 16),
    }
  );
  const [saving, setSaving] = useState(false);

  const set = (k: keyof Draft, v: unknown) => setDraft((d) => ({ ...d, [k]: v }));

  const submit = async () => {
    if (!draft.title?.trim()) return toast.error("Title is required");
    if (!draft.space_id) return toast.error("Pick a Space");
    if (!draft.start_time || !draft.end_time) return toast.error("Start and end time required");
    if (new Date(draft.end_time).getTime() <= new Date(draft.start_time).getTime())
      return toast.error("End time must be after start time");
    setSaving(true);
    try {
      const payload = {
        ...draft,
        start_time: new Date(draft.start_time as string).toISOString(),
        end_time: new Date(draft.end_time as string).toISOString(),
        rsvp_limit: draft.rsvp_limit ? Number(draft.rsvp_limit) : null,
        created_by: initial?.created_by ?? userId,
      };
      const q = initial
        ? sbEvents.from("events").update(payload).eq("id", initial.id).select("*").single()
        : sbEvents.from("events").insert(payload).select("*").single();
      const { data, error } = await q;
      if (error) throw error;
      toast.success(initial ? "Event updated" : "Event created");
      onSaved(data as unknown as EventRow);
    } catch (e) {
      toast.error((e as Error).message ?? "Could not save event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title"><Input value={draft.title ?? ""} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="Space">
          <Select value={draft.space_id ?? ""} onValueChange={(v) => set("space_id", v)}>
            <SelectTrigger><SelectValue placeholder="Select a Space" /></SelectTrigger>
            <SelectContent>{spaces.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Description"><Textarea rows={4} value={draft.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Type">
          <Select value={draft.event_type ?? "community_call"} onValueChange={(v) => set("event_type", v as EventType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((t) => <SelectItem key={t} value={t}>{EVENT_TYPE_LABELS[t]}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Visibility">
          <Select value={draft.visibility ?? "space_members"} onValueChange={(v) => set("visibility", v as EventVisibility)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{(Object.keys(VISIBILITY_LABELS) as EventVisibility[]).map((t) => <SelectItem key={t} value={t}>{VISIBILITY_LABELS[t]}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Access">
          <AccessStateSelect value={(draft.access_level ?? "free") as never} onChange={(v) => set("access_level", v as EventAccess)} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Start"><Input type="datetime-local" value={toLocalInput(draft.start_time)} onChange={(e) => set("start_time", e.target.value)} /></Field>
        <Field label="End"><Input type="datetime-local" value={toLocalInput(draft.end_time)} onChange={(e) => set("end_time", e.target.value)} /></Field>
        <Field label="Timezone"><Input value={draft.timezone ?? "UTC"} onChange={(e) => set("timezone", e.target.value)} placeholder="UTC" /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Location"><Input value={draft.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="Physical location (optional)" /></Field>
        <Field label="Virtual link"><Input value={draft.virtual_link ?? ""} onChange={(e) => set("virtual_link", e.target.value)} placeholder="https://…" /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Cover image URL"><Input value={draft.cover_image_url ?? ""} onChange={(e) => set("cover_image_url", e.target.value)} /></Field>
        <Field label="RSVP limit"><Input type="number" min={0} value={draft.rsvp_limit ?? ""} onChange={(e) => set("rsvp_limit", e.target.value ? Number(e.target.value) : null)} /></Field>
        <Field label="Status">
          <Select value={draft.status ?? "draft"} onValueChange={(v) => set("status", v as EventStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{(Object.keys(EVENT_STATUS_LABELS) as EventStatus[]).map((t) => <SelectItem key={t} value={t}>{EVENT_STATUS_LABELS[t]}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
      <div className="flex justify-end">
        <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : initial ? "Save changes" : "Create event"}</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function toLocalInput(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v).slice(0, 16);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
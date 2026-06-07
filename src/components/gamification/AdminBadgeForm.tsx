import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { upsertBadge, type Badge, type BadgeType } from "@/lib/gamification";

const TYPES: BadgeType[] = ["manual","milestone","course","event","community","special"];

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function AdminBadgeForm({ badge, onDone, onCancel }: { badge?: Badge | null; onDone: () => void; onCancel?: () => void }) {
  const [name, setName] = useState(badge?.name ?? "");
  const [slug, setSlug] = useState(badge?.slug ?? "");
  const [description, setDescription] = useState(badge?.description ?? "");
  const [iconUrl, setIconUrl] = useState(badge?.icon_url ?? "");
  const [type, setType] = useState<BadgeType>(badge?.badge_type ?? "manual");
  const [points, setPoints] = useState<number>(badge?.points_value ?? 0);
  const [active, setActive] = useState(badge?.active ?? true);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required");
    const finalSlug = slug.trim() || slugify(name);
    setSaving(true);
    try {
      await upsertBadge({
        id: badge?.id,
        name: name.trim(),
        slug: finalSlug,
        description: description.trim() || null,
        icon_url: iconUrl.trim() || null,
        badge_type: type,
        points_value: Number(points) || 0,
        active,
      });
      toast.success(badge ? "Badge updated" : "Badge created");
      onDone();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not save badge");
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => { setName(e.target.value); if (!badge) setSlug(slugify(e.target.value)); }} maxLength={80} required />
        </div>
        <div className="space-y-1.5">
          <Label>Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="auto from name" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={400} />
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as BadgeType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Points value</Label>
          <Input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} min={0} />
        </div>
        <div className="space-y-1.5">
          <Label>Icon URL</Label>
          <Input value={iconUrl ?? ""} onChange={(e) => setIconUrl(e.target.value)} placeholder="https://..." />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl border px-3 py-2">
        <div>
          <div className="text-sm font-medium">Active</div>
          <div className="text-xs text-muted-foreground">Inactive badges can't be auto- or manually awarded.</div>
        </div>
        <Switch checked={active} onCheckedChange={setActive} />
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : badge ? "Save badge" : "Create badge"}</Button>
      </div>
    </form>
  );
}
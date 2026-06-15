import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RESOURCE_TYPE_LABELS, RESOURCE_VISIBILITY_LABELS, RESOURCE_ACCESS_LABELS, type Resource, type ResourceFolder } from "@/lib/resources";

interface Props {
  initial?: Partial<Resource>;
  folders: ResourceFolder[];
  spaces: { id: string; name: string }[];
  onSubmit: (values: Partial<Resource>) => Promise<void>;
  onCancel: () => void;
}

export function AdminResourceForm({ initial, folders, spaces, onSubmit, onCancel }: Props) {
  const [v, setV] = useState<any>({
    title: "", description: "", resource_type: "file", file_url: "", external_url: "", thumbnail_url: "",
    visibility: "members_only", access_level: "free", space_id: null, folder_id: null, is_featured: false, is_archived: false,
    ...initial,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (initial) setV((s: any) => ({ ...s, ...initial })); }, [initial?.id]);

  const set = (k: string, val: any) => setV((s: any) => ({ ...s, [k]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...v };
      payload.file_url = payload.file_url || null;
      payload.external_url = payload.external_url || null;
      payload.thumbnail_url = payload.thumbnail_url || null;
      payload.description = payload.description || null;
      payload.space_id = payload.space_id || null;
      payload.folder_id = payload.folder_id || null;
      await onSubmit(payload);
    } finally { setBusy(false); }
  };

  const folderOptions = folders.filter((f) => (v.space_id ? f.space_id === v.space_id : f.space_id === null));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><Label>Title</Label><Input required value={v.title} onChange={(e) => set("title", e.target.value)} /></div>
      <div><Label>Description</Label><Textarea rows={3} value={v.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Resource type</Label>
          <Select value={v.resource_type} onValueChange={(x) => set("resource_type", x)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(RESOURCE_TYPE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Space</Label>
          <Select value={v.space_id ?? "global"} onValueChange={(x) => { set("space_id", x === "global" ? null : x); set("folder_id", null); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global</SelectItem>
              {spaces.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Folder</Label>
          <Select value={v.folder_id ?? "none"} onValueChange={(x) => set("folder_id", x === "none" ? null : x)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No folder</SelectItem>
              {folderOptions.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Thumbnail URL</Label>
          <Input value={v.thumbnail_url ?? ""} onChange={(e) => set("thumbnail_url", e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <Label>File URL</Label>
          <Input value={v.file_url ?? ""} onChange={(e) => set("file_url", e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <Label>External URL</Label>
          <Input value={v.external_url ?? ""} onChange={(e) => set("external_url", e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <Label>Visibility</Label>
          <Select value={v.visibility} onValueChange={(x) => set("visibility", x)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(RESOURCE_VISIBILITY_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Access level</Label>
          <Select value={v.access_level} onValueChange={(x) => set("access_level", x)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(RESOURCE_ACCESS_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm"><Switch checked={!!v.is_featured} onCheckedChange={(x) => set("is_featured", x)} /> Featured</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={!!v.is_archived} onCheckedChange={(x) => set("is_archived", x)} /> Archived</label>
      </div>
      <p className="text-xs text-muted-foreground">File upload to storage coming soon — paste a hosted URL for now.</p>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={busy}>{initial?.id ? "Save changes" : "Create resource"}</Button>
      </div>
    </form>
  );
}
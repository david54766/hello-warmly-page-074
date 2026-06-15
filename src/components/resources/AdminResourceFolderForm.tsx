import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RESOURCE_VISIBILITY_LABELS, RESOURCE_ACCESS_LABELS, type ResourceFolder } from "@/lib/resources";

export function AdminResourceFolderForm({ initial, spaces, folders, onSubmit, onCancel }: {
  initial?: Partial<ResourceFolder>;
  spaces: { id: string; name: string }[];
  folders: ResourceFolder[];
  onSubmit: (v: Partial<ResourceFolder>) => Promise<void>;
  onCancel: () => void;
}) {
  const [v, setV] = useState<any>({
    name: "", description: "", space_id: null, parent_folder_id: null, sort_order: 0,
    visibility: "members_only", access_level: "free", ...initial,
  });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (initial) setV((s: any) => ({ ...s, ...initial })); }, [initial?.id]);
  const set = (k: string, x: any) => setV((s: any) => ({ ...s, [k]: x }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const payload = { ...v };
      payload.description = payload.description || null;
      payload.space_id = payload.space_id || null;
      payload.parent_folder_id = payload.parent_folder_id || null;
      await onSubmit(payload);
    } finally { setBusy(false); }
  };

  const parentOptions = folders.filter((f) => f.id !== (initial as any)?.id && (v.space_id ? f.space_id === v.space_id : f.space_id === null));

  return (
    <form onSubmit={submit} className="space-y-4">
      <div><Label>Name</Label><Input required value={v.name} onChange={(e) => set("name", e.target.value)} /></div>
      <div><Label>Description</Label><Textarea rows={2} value={v.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Space</Label>
          <Select value={v.space_id ?? "global"} onValueChange={(x) => { set("space_id", x === "global" ? null : x); set("parent_folder_id", null); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global</SelectItem>
              {spaces.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Parent folder</Label>
          <Select value={v.parent_folder_id ?? "none"} onValueChange={(x) => set("parent_folder_id", x === "none" ? null : x)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {parentOptions.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
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
        <div>
          <Label>Sort order</Label>
          <Input type="number" value={v.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={busy}>{initial?.id ? "Save folder" : "Create folder"}</Button>
      </div>
    </form>
  );
}
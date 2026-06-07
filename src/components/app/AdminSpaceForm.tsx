import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Collection, Space, SpaceAccess, SpacePrivacy } from "@/lib/spaces";

export function AdminSpaceForm({
  open,
  onOpenChange,
  initial,
  collections,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Space | null;
  collections: Collection[];
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState(initial?.name ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "Hash");
  const [cover, setCover] = useState(initial?.cover_image_url ?? "");
  const [collectionId, setCollectionId] = useState<string>(initial?.collection_id ?? collections[0]?.id ?? "");
  const [privacy, setPrivacy] = useState<SpacePrivacy>(initial?.privacy_level ?? "public");
  const [access, setAccess] = useState<SpaceAccess>(initial?.access_level ?? "free");
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? 0));
  const [chatEnabled, setChatEnabled] = useState<boolean>(initial?.chat_enabled ?? true);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setBusy(true);
    const payload = {
      name: name.trim(),
      tagline: tagline.trim() || null,
      description: description.trim() || null,
      icon: icon.trim() || null,
      cover_image_url: cover.trim() || null,
      collection_id: collectionId || null,
      privacy_level: privacy,
      access_level: access,
      sort_order: Number(sortOrder) || 0,
      chat_enabled: chatEnabled,
    };
    const { error } = initial
      ? await supabase.from("spaces").update(payload).eq("id", initial.id)
      : await supabase.from("spaces").insert({ ...payload, created_by: user?.id ?? null });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Space updated" : "Space created");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Space" : "New Space"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Tagline</Label>
            <Input value={tagline ?? ""} onChange={(e) => setTagline(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Icon (lucide name)</Label>
              <Input value={icon ?? ""} onChange={(e) => setIcon(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Cover image URL</Label>
            <Input value={cover ?? ""} onChange={(e) => setCover(e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label>Collection</Label>
            <Select value={collectionId} onValueChange={setCollectionId}>
              <SelectTrigger><SelectValue placeholder="Choose a collection" /></SelectTrigger>
              <SelectContent>
                {collections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Privacy</Label>
              <Select value={privacy} onValueChange={(v) => setPrivacy(v as SpacePrivacy)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="members_only">Members only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Access</Label>
              <Select value={access} onValueChange={(v) => setAccess(v as SpaceAccess)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="preview">Preview</SelectItem>
                  <SelectItem value="paid_placeholder">Paid (placeholder)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm">Chat enabled</Label>
              <p className="text-xs text-muted-foreground">Lets Space members chat in real time.</p>
            </div>
            <Switch checked={chatEnabled} onCheckedChange={setChatEnabled} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy && <Loader2 className="size-4 mr-1.5 animate-spin" />}Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
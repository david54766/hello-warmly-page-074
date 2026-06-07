import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Collection } from "@/lib/spaces";

export function AdminCollectionForm({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Collection | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "Folder");
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? 0));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setBusy(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      icon: icon.trim() || null,
      sort_order: Number(sortOrder) || 0,
    };
    const { error } = initial
      ? await supabase.from("collections").update(payload).eq("id", initial.id)
      : await supabase.from("collections").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Collection updated" : "Collection created");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Collection" : "New Collection"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Community" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Icon name</Label>
              <Input value={icon ?? ""} onChange={(e) => setIcon(e.target.value)} placeholder="lucide name e.g. Users" />
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
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
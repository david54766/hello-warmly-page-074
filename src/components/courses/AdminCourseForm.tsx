import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Course, CourseAccess, CourseVisibility } from "@/lib/courses";
import type { Space } from "@/lib/spaces";

export function AdminCourseForm({
  open,
  onOpenChange,
  initial,
  spaces,
  defaultSpaceId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Course | null;
  spaces: Space[];
  defaultSpaceId?: string;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [thumb, setThumb] = useState(initial?.thumbnail_url ?? "");
  const [overview, setOverview] = useState(initial?.overview_content ?? "");
  const [spaceId, setSpaceId] = useState<string>(initial?.space_id ?? defaultSpaceId ?? spaces[0]?.id ?? "");
  const [visibility, setVisibility] = useState<CourseVisibility>(initial?.visibility ?? "space_members");
  const [access, setAccess] = useState<CourseAccess>(initial?.access_level ?? "free");
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? 0));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!title.trim()) return toast.error("Title is required");
    if (!spaceId) return toast.error("Choose a Space");
    setBusy(true);
    const payload = {
      title: title.trim().slice(0, 200),
      description: description.trim() || null,
      thumbnail_url: thumb.trim() || null,
      overview_content: overview.trim() || null,
      space_id: spaceId,
      visibility,
      access_level: access,
      sort_order: Number(sortOrder) || 0,
    };
    const { error } = initial
      ? await supabase.from("courses").update(payload).eq("id", initial.id)
      : await supabase.from("courses").insert({ ...payload, created_by: user?.id ?? null });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Course updated" : "Course created");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit course" : "New course"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
          <div className="space-y-1.5"><Label>Overview content</Label><Textarea value={overview ?? ""} onChange={(e) => setOverview(e.target.value)} rows={4} /></div>
          <div className="space-y-1.5"><Label>Thumbnail URL</Label><Input value={thumb ?? ""} onChange={(e) => setThumb(e.target.value)} placeholder="https://…" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Space</Label>
              <Select value={spaceId} onValueChange={setSpaceId}>
                <SelectTrigger><SelectValue placeholder="Choose a Space" /></SelectTrigger>
                <SelectContent>
                  {spaces.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as CourseVisibility)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="members_only">Members only</SelectItem>
                  <SelectItem value="space_members">Space members</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Access</Label>
              <Select value={access} onValueChange={(v) => setAccess(v as CourseAccess)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="preview">Preview</SelectItem>
                  <SelectItem value="paid_placeholder">Paid (placeholder)</SelectItem>
                </SelectContent>
              </Select>
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
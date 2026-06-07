import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { CourseSection, Lesson, LessonVisibility } from "@/lib/courses";

export function AdminLessonEditor({
  open,
  onOpenChange,
  initial,
  courseId,
  sections,
  defaultSectionId,
  defaultSortOrder = 0,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Lesson | null;
  courseId: string;
  sections: CourseSection[];
  defaultSectionId?: string | null;
  defaultSortOrder?: number;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [videoUrl, setVideoUrl] = useState(initial?.video_url ?? "");
  const [attachmentsText, setAttachmentsText] = useState((initial?.attachments ?? []).join("\n"));
  const [sectionId, setSectionId] = useState<string>(initial?.section_id ?? defaultSectionId ?? sections[0]?.id ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? defaultSortOrder));
  const [preview, setPreview] = useState(initial?.preview_enabled ?? false);
  const [completionRequired, setCompletionRequired] = useState(initial?.completion_required ?? true);
  const [visibility, setVisibility] = useState<LessonVisibility>(initial?.visibility ?? "visible");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!title.trim()) return toast.error("Title is required");
    setBusy(true);
    const attachments = attachmentsText.split("\n").map((s) => s.trim()).filter(Boolean);
    const payload = {
      title: title.trim().slice(0, 200),
      content: content.slice(0, 50000),
      video_url: videoUrl.trim() || null,
      attachments,
      section_id: sectionId || null,
      sort_order: Number(sortOrder) || 0,
      preview_enabled: preview,
      completion_required: completionRequired,
      visibility,
      course_id: courseId,
    };
    const { error } = initial
      ? await supabase.from("lessons").update(payload).eq("id", initial.id)
      : await supabase.from("lessons").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Lesson updated" : "Lesson added");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{initial ? "Edit lesson" : "New lesson"}</DialogTitle></DialogHeader>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} /></div>
          <div className="space-y-1.5"><Label>Written content</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Video URL</Label><Input value={videoUrl ?? ""} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/…" /></div>
            <div className="space-y-1.5">
              <Label>Section</Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger><SelectValue placeholder="Choose a section" /></SelectTrigger>
                <SelectContent>
                  {sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Attachments (one URL per line)</Label>
            <Textarea value={attachmentsText} onChange={(e) => setAttachmentsText(e.target.value)} rows={2} placeholder="https://…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Sort order</Label><Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as LessonVisibility)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="visible">Visible</SelectItem>
                  <SelectItem value="preview">Preview</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
            <div><Label className="cursor-pointer">Preview enabled</Label><p className="text-xs text-muted-foreground">Show this lesson to non-members as a preview.</p></div>
            <Switch checked={preview} onCheckedChange={setPreview} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
            <div><Label className="cursor-pointer">Completion required</Label><p className="text-xs text-muted-foreground">Counts toward course progress.</p></div>
            <Switch checked={completionRequired} onCheckedChange={setCompletionRequired} />
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
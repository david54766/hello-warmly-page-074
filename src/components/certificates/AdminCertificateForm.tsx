import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { createCertificate, updateCertificate, type Certificate } from "@/lib/certificates";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AdminCertificateForm({ initial, onSaved }: { initial?: Certificate | null; onSaved: () => void }) {
  const { user } = useAuth();
  const [courseId, setCourseId] = useState(initial?.course_id ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [templateUrl, setTemplateUrl] = useState(initial?.template_url ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("courses").select("id,title").eq("is_archived", false).order("title").then(({ data }) => setCourses((data as any) ?? []));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !courseId || !title.trim()) { toast.error("Course and title required"); return; }
    setSubmitting(true);
    try {
      const payload = { course_id: courseId, title: title.trim(), description: description || null, template_url: templateUrl || null, active };
      if (initial) await updateCertificate(initial.id, payload);
      else await createCertificate(payload, user.id);
      toast.success("Saved");
      onSaved();
    } catch (err: any) { toast.error(err.message ?? "Failed"); }
    finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Course</Label>
        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
          <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
      </div>
      <div className="space-y-1.5">
        <Label>Template URL (placeholder)</Label>
        <Input value={templateUrl ?? ""} onChange={(e) => setTemplateUrl(e.target.value)} placeholder="https://…" />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={active} onCheckedChange={setActive} />
        <Label>Active — issue this certificate on course completion</Label>
      </div>
      <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save Certificate"}</Button>
    </form>
  );
}
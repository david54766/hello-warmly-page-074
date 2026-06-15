import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save, Wand2, Archive } from "lucide-react";
import { toast } from "sonner";
import { AICourseOutlineEditor } from "@/components/ai/AICourseOutlineEditor";
import { AICourseOutlinePreview } from "@/components/ai/AICourseOutlinePreview";
import { ConvertToCourseModal } from "@/components/ai/ConvertToCourseModal";
import { AIGenerationStatusPill } from "@/components/ai/AIGenerationStatusPill";
import { archiveCourseGeneration, getCourseGeneration, updateCourseGeneration, type AICourseGeneration, type CourseOutline } from "@/lib/aiCourses";

export const Route = createFileRoute("/_authenticated/admin/ai-course-builder/$generationId")({
  component: AICourseBuilderDetail,
});

function AICourseBuilderDetail() {
  const { generationId } = Route.useParams();
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [gen, setGen] = useState<AICourseGeneration | null>(null);
  const [outline, setOutline] = useState<CourseOutline | null>(null);
  const [convertOpen, setConvertOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);

  useEffect(() => {
    (async () => {
      const g = await getCourseGeneration(generationId);
      setGen(g);
      setOutline(g?.generated_outline_json ?? null);
    })();
  }, [generationId]);

  if (!isAdmin) return null;
  if (!gen || !outline) return <div className="space-y-3"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-60" /></div>;

  const save = async () => {
    setBusy(true);
    try {
      await updateCourseGeneration(gen.id, { generated_outline_json: outline, title: outline.course_title, status: "draft" });
      toast.success("Saved as draft");
      const g = await getCourseGeneration(gen.id); setGen(g);
    } catch (e: any) { toast.error(e?.message ?? "Failed to save"); }
    finally { setBusy(false); }
  };

  const archive = async () => {
    if (!confirm("Archive this generation?")) return;
    await archiveCourseGeneration(gen.id);
    toast.success("Archived");
    navigate({ to: "/admin/ai-course-generations" });
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link to="/admin/ai-course-builder"><ArrowLeft className="size-4 mr-1.5" />Back to builder</Link>
      </Button>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Review outline</h1>
            <AIGenerationStatusPill status={gen.status} />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">Edit anything below, save as a draft, or create a real course in your chosen Space.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={archive}><Archive className="size-4 mr-1.5" />Archive</Button>
          <Button variant="outline" onClick={save} disabled={busy}><Save className="size-4 mr-1.5" />Save draft</Button>
          <Button onClick={() => setConvertOpen(true)} disabled={gen.status === "converted"}><Wand2 className="size-4 mr-1.5" />Create course</Button>
        </div>
      </header>

      {gen.created_course_id && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200 p-3 text-sm">
          Already converted. <Link to="/admin/courses/$courseId" params={{ courseId: gen.created_course_id }} className="underline font-medium">Open course</Link>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <AICourseOutlineEditor value={outline} onChange={setOutline} />
        <AICourseOutlinePreview outline={outline} />
      </div>

      <ConvertToCourseModal open={convertOpen} onOpenChange={setConvertOpen} generation={gen} onConverted={(courseId) => navigate({ to: "/admin/courses/$courseId", params: { courseId } })} />
    </div>
  );
}
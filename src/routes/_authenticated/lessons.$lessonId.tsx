import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/DashboardCard";
import { LessonViewer } from "@/components/courses/LessonViewer";
import { LessonNavigation } from "@/components/courses/LessonNavigation";
import { LockedContentCard } from "@/components/courses/LockedContentCard";
import { SaveButton } from "@/components/onboarding/SaveButton";
import { CheckCircle2, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Course, CourseSection, Lesson, LessonProgress } from "@/lib/courses";

export const Route = createFileRoute("/_authenticated/lessons/$lessonId")({
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [section, setSection] = useState<CourseSection | null>(null);
  const [siblings, setSiblings] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: l } = await supabase.from("lessons").select("*").eq("id", lessonId).maybeSingle();
    if (!l) { setLesson(null); setLoading(false); return; }
    setLesson(l as Lesson);
    const [{ data: c }, { data: ls }, { data: s }, prog] = await Promise.all([
      supabase.from("courses").select("*").eq("id", l.course_id).maybeSingle(),
      supabase.from("lessons").select("*").eq("course_id", l.course_id).order("sort_order"),
      l.section_id ? supabase.from("course_sections").select("*").eq("id", l.section_id).maybeSingle() : Promise.resolve({ data: null }),
      user ? supabase.from("lesson_progress").select("*").eq("user_id", user.id).eq("lesson_id", lessonId).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    setCourse((c ?? null) as Course | null);
    setSection((s ?? null) as CourseSection | null);
    setSiblings((ls ?? []) as Lesson[]);
    setProgress(((prog as { data: LessonProgress | null }).data ?? null));
    setLoading(false);
  };

  useEffect(() => { load(); }, [lessonId, user]);

  // Mark in_progress on first view.
  useEffect(() => {
    if (!user || !lesson) return;
    if (lesson.visibility === "locked") return;
    if (progress?.status === "completed" || progress?.status === "in_progress") {
      // Just bump last_viewed_at
      supabase.from("lesson_progress").update({ last_viewed_at: new Date().toISOString() }).eq("id", progress.id);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("lesson_progress")
        .upsert(
          { user_id: user.id, lesson_id: lesson.id, status: "in_progress", last_viewed_at: new Date().toISOString() },
          { onConflict: "user_id,lesson_id" }
        )
        .select()
        .maybeSingle();
      if (data) setProgress(data as LessonProgress);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, lesson?.id]);

  const ordered = useMemo(() => siblings.slice().sort((a, b) => a.sort_order - b.sort_order), [siblings]);
  const visibleOrdered = useMemo(() => ordered.filter((l) => l.visibility !== "hidden"), [ordered]);
  const idx = useMemo(() => visibleOrdered.findIndex((l) => l.id === lessonId), [visibleOrdered, lessonId]);
  const prev = idx > 0 ? visibleOrdered[idx - 1]?.id : null;
  const next = idx >= 0 && idx < visibleOrdered.length - 1 ? visibleOrdered[idx + 1]?.id : null;

  const markComplete = async () => {
    if (!user || !lesson) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("lesson_progress")
      .upsert(
        { user_id: user.id, lesson_id: lesson.id, status: "completed", completed_at: new Date().toISOString(), last_viewed_at: new Date().toISOString() },
        { onConflict: "user_id,lesson_id" }
      )
      .select()
      .maybeSingle();
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data) setProgress(data as LessonProgress);
    toast.success("Lesson marked complete");
  };

  const markIncomplete = async () => {
    if (!progress) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("lesson_progress")
      .update({ status: "in_progress", completed_at: null })
      .eq("id", progress.id)
      .select()
      .maybeSingle();
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data) setProgress(data as LessonProgress);
    toast.success("Marked as in progress");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="aspect-video rounded-2xl" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <EmptyState
        icon={<Lock className="size-5" />}
        title="Lesson not available"
        description="This lesson may be locked or no longer exists."
        action={<Button onClick={() => navigate({ to: "/courses" })}>Back to library</Button>}
      />
    );
  }

  const isLocked = lesson.visibility === "locked";

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <nav className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
        <Link to="/courses" className="hover:underline">Courses</Link>
        {course && (
          <>
            <span>/</span>
            <Link to="/courses/$courseId" params={{ courseId: course.id }} className="hover:underline truncate max-w-[200px]">{course.title}</Link>
          </>
        )}
        {section && (<><span>/</span><span className="truncate max-w-[200px]">{section.title}</span></>)}
      </nav>

      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{lesson.title}</h1>
            {section && <p className="text-sm text-muted-foreground">Section · {section.title}</p>}
          </div>
          <SaveButton targetType="lesson" targetId={lesson.id} variant="button" />
        </div>
      </header>

      {isLocked ? (
        <LockedContentCard
          title="This lesson is locked"
          description="You need access to this course to view this lesson."
        />
      ) : (
        <LessonViewer lesson={lesson} />
      )}

      {!isLocked && lesson.completion_required && (
        <div className="flex flex-wrap items-center gap-2">
          {progress?.status === "completed" ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />Completed
              </span>
              <Button variant="outline" size="sm" onClick={markIncomplete} disabled={busy}>
                {busy && <Loader2 className="size-4 mr-1.5 animate-spin" />}Mark as in progress
              </Button>
            </>
          ) : (
            <Button onClick={markComplete} disabled={busy}>
              {busy ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="size-4 mr-1.5" />}
              Mark complete
            </Button>
          )}
        </div>
      )}

      {course && <LessonNavigation courseId={course.id} prevId={prev} nextId={next} />}
    </div>
  );
}
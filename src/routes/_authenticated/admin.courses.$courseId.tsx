import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/DashboardCard";
import { AdminCourseForm } from "@/components/courses/AdminCourseForm";
import { AdminSectionForm } from "@/components/courses/AdminSectionForm";
import { AdminLessonEditor } from "@/components/courses/AdminLessonEditor";
import { ArrowLeft, Plus, Pencil, Trash2, BookOpen, ChevronUp, ChevronDown, Eye, Lock } from "lucide-react";
import { toast } from "sonner";
import { LESSON_VISIBILITY_LABELS, type Course, type CourseSection, type Lesson } from "@/lib/courses";
import type { Space } from "@/lib/spaces";

export const Route = createFileRoute("/_authenticated/admin/courses/$courseId")({
  component: AdminCourseBuilder,
});

function AdminCourseBuilder() {
  const { courseId } = Route.useParams();
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [sectionFormOpen, setSectionFormOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CourseSection | null>(null);
  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [defaultLessonSection, setDefaultLessonSection] = useState<string | null>(null);

  useEffect(() => { if (!authLoading && !isAdmin) navigate({ to: "/dashboard" }); }, [authLoading, isAdmin, navigate]);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: secs }, { data: ls }, { data: sp }] = await Promise.all([
      supabase.from("courses").select("*").eq("id", courseId).maybeSingle(),
      supabase.from("course_sections").select("*").eq("course_id", courseId).order("sort_order"),
      supabase.from("lessons").select("*").eq("course_id", courseId).order("sort_order"),
      supabase.from("spaces").select("*").eq("is_archived", false).order("sort_order"),
    ]);
    setCourse((c ?? null) as Course | null);
    setSections((secs ?? []) as CourseSection[]);
    setLessons((ls ?? []) as Lesson[]);
    setSpaces((sp ?? []) as Space[]);
    setLoading(false);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin, courseId]);

  const lessonsBySection = useMemo(() => {
    const m = new Map<string | null, Lesson[]>();
    lessons.forEach((l) => {
      const arr = m.get(l.section_id) ?? [];
      arr.push(l);
      m.set(l.section_id, arr);
    });
    for (const arr of m.values()) arr.sort((a, b) => a.sort_order - b.sort_order);
    return m;
  }, [lessons]);

  const moveSection = async (s: CourseSection, dir: -1 | 1) => {
    const { error } = await supabase.from("course_sections").update({ sort_order: s.sort_order + dir }).eq("id", s.id);
    if (error) return toast.error(error.message);
    load();
  };
  const removeSection = async (s: CourseSection) => {
    if (!confirm(`Delete section "${s.title}"? Lessons in it will become uncategorized.`)) return;
    const { error } = await supabase.from("course_sections").delete().eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("Section deleted");
    load();
  };
  const moveLesson = async (l: Lesson, dir: -1 | 1) => {
    const { error } = await supabase.from("lessons").update({ sort_order: l.sort_order + dir }).eq("id", l.id);
    if (error) return toast.error(error.message);
    load();
  };
  const removeLesson = async (l: Lesson) => {
    if (!confirm(`Delete lesson "${l.title}"?`)) return;
    const { error } = await supabase.from("lessons").delete().eq("id", l.id);
    if (error) return toast.error(error.message);
    toast.success("Lesson deleted");
    load();
  };

  if (!isAdmin) return null;
  if (loading) {
    return <div className="space-y-3"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-40" /></div>;
  }
  if (!course) {
    return <EmptyState icon={<BookOpen className="size-5" />} title="Course not found"
      action={<Button onClick={() => navigate({ to: "/admin/courses" })}>Back</Button>} />;
  }

  const renderLessonRow = (l: Lesson) => (
    <li key={l.id} className="flex flex-wrap items-center gap-2 px-3 py-2 border-t border-border first:border-t-0">
      <span className="text-xs text-muted-foreground w-6 text-right">{l.sort_order}</span>
      <span className="flex-1 min-w-0 truncate text-sm">{l.title}</span>
      <span className="text-[10px] uppercase rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">{LESSON_VISIBILITY_LABELS[l.visibility]}</span>
      {l.preview_enabled && <span className="text-[10px] uppercase rounded-full bg-primary/10 text-primary px-1.5 py-0.5 inline-flex items-center gap-1"><Eye className="size-3" />Preview</span>}
      {l.visibility === "locked" && <span className="text-[10px] uppercase rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground inline-flex items-center gap-1"><Lock className="size-3" />Locked</span>}
      <Button variant="ghost" size="icon" onClick={() => moveLesson(l, -1)}><ChevronUp className="size-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => moveLesson(l, 1)}><ChevronDown className="size-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => { setEditingLesson(l); setLessonFormOpen(true); }}><Pencil className="size-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => removeLesson(l)}><Trash2 className="size-4" /></Button>
    </li>
  );

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link to="/admin/courses"><ArrowLeft className="size-4 mr-1.5" />All courses</Link>
      </Button>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{course.title}</h1>
          {course.description && <p className="text-muted-foreground mt-1">{course.description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setCourseFormOpen(true)}><Pencil className="size-4 mr-1.5" />Edit overview</Button>
          <Button asChild variant="outline"><Link to="/courses/$courseId" params={{ courseId: course.id }}>View as member</Link></Button>
        </div>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sections</h2>
          <Button size="sm" onClick={() => { setEditingSection(null); setSectionFormOpen(true); }}>
            <Plus className="size-4 mr-1.5" />Add section
          </Button>
        </div>
        {sections.length === 0 && !lessonsBySection.get(null)?.length ? (
          <EmptyState icon={<BookOpen className="size-5" />} title="No sections yet" description="Add a section to start organizing lessons." />
        ) : (
          <div className="space-y-3">
            {sections.map((s) => (
              <Card key={s.id} className="rounded-2xl">
                <CardContent className="pt-5">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs text-muted-foreground w-6 text-right">{s.sort_order}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{s.title}</p>
                      {s.description && <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => moveSection(s, -1)}><ChevronUp className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => moveSection(s, 1)}><ChevronDown className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditingSection(s); setSectionFormOpen(true); }}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => removeSection(s)}><Trash2 className="size-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditingLesson(null); setDefaultLessonSection(s.id); setLessonFormOpen(true); }}>
                      <Plus className="size-4 mr-1.5" />Lesson
                    </Button>
                  </div>
                  <ul className="rounded-xl border border-border overflow-hidden bg-background">
                    {(lessonsBySection.get(s.id) ?? []).length === 0 ? (
                      <li className="px-3 py-3 text-sm text-muted-foreground">No lessons in this section yet.</li>
                    ) : (
                      (lessonsBySection.get(s.id) ?? []).map(renderLessonRow)
                    )}
                  </ul>
                </CardContent>
              </Card>
            ))}
            {(lessonsBySection.get(null)?.length ?? 0) > 0 && (
              <Card className="rounded-2xl border-dashed">
                <CardContent className="pt-5">
                  <p className="font-medium mb-2">Uncategorized lessons</p>
                  <ul className="rounded-xl border border-border overflow-hidden bg-background">
                    {(lessonsBySection.get(null) ?? []).map(renderLessonRow)}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </section>

      <AdminCourseForm open={courseFormOpen} onOpenChange={setCourseFormOpen} initial={course} spaces={spaces} onSaved={load} />
      <AdminSectionForm
        open={sectionFormOpen}
        onOpenChange={setSectionFormOpen}
        initial={editingSection}
        courseId={course.id}
        defaultSortOrder={(sections[sections.length - 1]?.sort_order ?? 0) + 1}
        onSaved={load}
      />
      {(sections.length > 0 || editingLesson) && (
        <AdminLessonEditor
          open={lessonFormOpen}
          onOpenChange={setLessonFormOpen}
          initial={editingLesson}
          courseId={course.id}
          sections={sections}
          defaultSectionId={defaultLessonSection}
          defaultSortOrder={(lessons[lessons.length - 1]?.sort_order ?? 0) + 1}
          onSaved={load}
        />
      )}
    </div>
  );
}
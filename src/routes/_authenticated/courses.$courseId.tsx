import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/DashboardCard";
import { LessonList } from "@/components/courses/LessonList";
import { CourseProgressBar } from "@/components/courses/CourseProgressBar";
import { LockedContentCard } from "@/components/courses/LockedContentCard";
import { LockedContentPage } from "@/components/access/LockedContentCard";
import { hasAccess } from "@/lib/access";
import { ArrowLeft, BookOpen, Play, Lock } from "lucide-react";
import { COURSE_ACCESS_LABELS, isCourseLocked, type Course, type CourseSection, type Lesson, type LessonProgress } from "@/lib/courses";
import type { Space } from "@/lib/spaces";

export const Route = createFileRoute("/_authenticated/courses/$courseId")({
  component: CourseDetail,
});

function CourseDetail() {
  const { courseId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [space, setSpace] = useState<Space | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [allowed, setAllowed] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: c } = await supabase.from("courses").select("*").eq("id", courseId).maybeSingle();
      if (!c) { setCourse(null); setLoading(false); return; }
      setCourse(c as Course);
      if ((c.access_level === "paid" || c.access_level === "paid_placeholder") && user) {
        setAllowed(await hasAccess(user.id, "course", c.id));
      } else {
        setAllowed(true);
      }
      const [{ data: sp }, { data: secs }, { data: ls }, prog] = await Promise.all([
        supabase.from("spaces").select("*").eq("id", c.space_id).maybeSingle(),
        supabase.from("course_sections").select("*").eq("course_id", courseId).order("sort_order"),
        supabase.from("lessons").select("*").eq("course_id", courseId).order("sort_order"),
        user ? supabase.from("lesson_progress").select("*").eq("user_id", user.id) : Promise.resolve({ data: [] as LessonProgress[] }),
      ]);
      setSpace((sp ?? null) as Space | null);
      setSections((secs ?? []) as CourseSection[]);
      setLessons((ls ?? []) as Lesson[]);
      setProgress(((prog as { data: LessonProgress[] }).data ?? []));
      setLoading(false);
    })();
  }, [courseId, user]);

  const progressByLesson = useMemo(() => new Map(progress.map((p) => [p.lesson_id, p])), [progress]);
  const completed = useMemo(() => lessons.filter((l) => progressByLesson.get(l.id)?.status === "completed").length, [lessons, progressByLesson]);
  const nextLesson = useMemo(() => {
    const ordered = lessons.slice().sort((a, b) => a.sort_order - b.sort_order);
    const incomplete = ordered.find((l) => l.visibility !== "hidden" && l.visibility !== "locked" && progressByLesson.get(l.id)?.status !== "completed");
    return incomplete ?? ordered.find((l) => l.visibility !== "hidden" && l.visibility !== "locked") ?? null;
  }, [lessons, progressByLesson]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="aspect-[16/5] rounded-2xl" />
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!course) {
    return (
      <EmptyState
        icon={<Lock className="size-5" />}
        title="Course not available"
        description="This course may be private or no longer exists."
        action={<Button onClick={() => navigate({ to: "/courses" })}>Back to library</Button>}
      />
    );
  }

  const locked = isCourseLocked(course);

  if (locked && !allowed) {
    return (
      <LockedContentPage
        title={`${course.title} is a paid course`}
        message="Upgrade your membership or purchase this course to unlock all lessons."
      />
    );
  }

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link to="/courses"><ArrowLeft className="size-4 mr-1.5" />Course Library</Link>
      </Button>

      <header className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {space && (
              <Link to="/spaces/$spaceId" params={{ spaceId: space.id }} className="hover:underline">
                {space.name}
              </Link>
            )}
            <span>·</span>
            <span>{COURSE_ACCESS_LABELS[course.access_level]}</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{course.title}</h1>
          {course.description && <p className="text-muted-foreground">{course.description}</p>}
          {course.overview_content && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap pt-2">{course.overview_content}</p>
          )}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            {nextLesson && !locked && (
              <Button asChild>
                <Link to="/lessons/$lessonId" params={{ lessonId: nextLesson.id }}>
                  <Play className="size-4 mr-1.5" />
                  {completed > 0 ? "Continue learning" : "Start course"}
                </Link>
              </Button>
            )}
            {locked && <Button disabled><Lock className="size-4 mr-1.5" />Unlock coming soon</Button>}
          </div>
        </div>
        <div className="aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/5 to-background grid place-items-center">
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt="" className="size-full object-cover" />
          ) : (
            <BookOpen className="size-12 text-primary/40" />
          )}
        </div>
      </header>

      <div className="max-w-md">
        <CourseProgressBar total={lessons.length} completed={completed} />
      </div>

      {locked && (
        <LockedContentCard
          title="This is a paid course"
          description="Preview lessons are available below. Full access will be unlocked when payments go live."
        />
      )}

      {lessons.length === 0 ? (
        <EmptyState icon={<BookOpen className="size-5" />} title="No lessons yet" description="Lessons will appear here as they're added." />
      ) : (
        <LessonList sections={sections} lessons={lessons} progressByLesson={progressByLesson} />
      )}
    </div>
  );
}
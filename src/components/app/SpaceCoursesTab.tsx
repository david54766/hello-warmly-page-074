import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/DashboardCard";
import { CourseCard } from "@/components/courses/CourseCard";
import { GraduationCap } from "lucide-react";
import type { Course, Lesson, LessonProgress } from "@/lib/courses";

export function SpaceCoursesTab({ spaceId }: { spaceId: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: cs } = await supabase.from("courses").select("*").eq("space_id", spaceId).eq("is_archived", false).order("sort_order");
      const list = (cs ?? []) as Course[];
      setCourses(list);
      const ids = list.map((c) => c.id);
      const [{ data: ls }, prog] = await Promise.all([
        ids.length ? supabase.from("lessons").select("*").in("course_id", ids) : Promise.resolve({ data: [] as Lesson[] }),
        user ? supabase.from("lesson_progress").select("*").eq("user_id", user.id) : Promise.resolve({ data: [] as LessonProgress[] }),
      ]);
      setLessons((ls ?? []) as Lesson[]);
      setProgress(((prog as { data: LessonProgress[] }).data ?? []));
      setLoading(false);
    })();
  }, [spaceId, user]);

  const lessonsByCourse = useMemo(() => {
    const m = new Map<string, Lesson[]>();
    lessons.forEach((l) => { const a = m.get(l.course_id) ?? []; a.push(l); m.set(l.course_id, a); });
    return m;
  }, [lessons]);
  const completedByCourse = useMemo(() => {
    const lessonToCourse = new Map(lessons.map((l) => [l.id, l.course_id]));
    const m = new Map<string, number>();
    progress.forEach((p) => {
      if (p.status !== "completed") return;
      const c = lessonToCourse.get(p.lesson_id);
      if (c) m.set(c, (m.get(c) ?? 0) + 1);
    });
    return m;
  }, [progress, lessons]);

  if (loading) return <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>;
  if (courses.length === 0) {
    return <EmptyState icon={<GraduationCap className="size-5" />} title="No courses in this Space yet" description="Courses created in this Space will appear here." />;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {courses.map((c) => (
        <CourseCard
          key={c.id}
          course={c}
          lessonCount={(lessonsByCourse.get(c.id) ?? []).length}
          completedCount={completedByCourse.get(c.id) ?? 0}
        />
      ))}
    </div>
  );
}
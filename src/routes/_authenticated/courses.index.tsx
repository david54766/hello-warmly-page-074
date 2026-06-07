import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/DashboardCard";
import { CourseCard } from "@/components/courses/CourseCard";
import { BookOpen, Search } from "lucide-react";
import type { Course, Lesson, LessonProgress } from "@/lib/courses";
import type { Space } from "@/lib/spaces";

export const Route = createFileRoute("/_authenticated/courses/")({
  component: CourseLibrary,
});

function CourseLibrary() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: cs } = await supabase.from("courses").select("*").eq("is_archived", false).order("sort_order");
      const courseList = (cs ?? []) as Course[];
      setCourses(courseList);
      const ids = courseList.map((c) => c.id);
      const spaceIds = Array.from(new Set(courseList.map((c) => c.space_id)));
      const [{ data: ls }, { data: sp }, prog] = await Promise.all([
        ids.length ? supabase.from("lessons").select("*").in("course_id", ids) : Promise.resolve({ data: [] as Lesson[] }),
        spaceIds.length ? supabase.from("spaces").select("*").in("id", spaceIds) : Promise.resolve({ data: [] as Space[] }),
        user ? supabase.from("lesson_progress").select("*").eq("user_id", user.id) : Promise.resolve({ data: [] as LessonProgress[] }),
      ]);
      setLessons((ls ?? []) as Lesson[]);
      setSpaces((sp ?? []) as Space[]);
      setProgress(((prog as { data: LessonProgress[] }).data ?? []));
      setLoading(false);
    })();
  }, [user]);

  const lessonsByCourse = useMemo(() => {
    const m = new Map<string, Lesson[]>();
    lessons.forEach((l) => {
      const arr = m.get(l.course_id) ?? [];
      arr.push(l);
      m.set(l.course_id, arr);
    });
    return m;
  }, [lessons]);
  const completedByCourse = useMemo(() => {
    const lessonToCourse = new Map(lessons.map((l) => [l.id, l.course_id]));
    const m = new Map<string, number>();
    progress.forEach((p) => {
      if (p.status !== "completed") return;
      const c = lessonToCourse.get(p.lesson_id);
      if (!c) return;
      m.set(c, (m.get(c) ?? 0) + 1);
    });
    return m;
  }, [progress, lessons]);
  const spacesById = useMemo(() => new Map(spaces.map((s) => [s.id, s])), [spaces]);

  const filtered = useMemo(() => {
    if (!search.trim()) return courses;
    const q = search.toLowerCase();
    return courses.filter((c) => c.title.toLowerCase().includes(q) || (c.description?.toLowerCase().includes(q) ?? false));
  }, [courses, search]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Course Library</h1>
        <p className="text-muted-foreground mt-1">Learn at your own pace with structured lessons, resources, and progress tracking.</p>
      </header>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses…" className="pl-9" maxLength={100} />
      </div>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-5" />}
          title="No courses are available yet"
          description="New learning content will appear here soon."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              spaceName={spacesById.get(c.space_id)?.name}
              lessonCount={(lessonsByCourse.get(c.id) ?? []).length}
              completedCount={completedByCourse.get(c.id) ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
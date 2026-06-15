import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/DashboardCard";
import { AdminCourseForm } from "@/components/courses/AdminCourseForm";
import { Search, Plus, Pencil, Archive, ArchiveRestore, BookOpen, Settings2, Trash2, ChevronUp, ChevronDown, Sparkles, History } from "lucide-react";
import { toast } from "sonner";
import { COURSE_ACCESS_LABELS, COURSE_VISIBILITY_LABELS, type Course } from "@/lib/courses";
import type { Space } from "@/lib/spaces";

export const Route = createFileRoute("/_authenticated/admin/courses/")({
  component: AdminCoursesPage,
});

function AdminCoursesPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [search, setSearch] = useState("");
  const [spaceFilter, setSpaceFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);

  useEffect(() => { if (!authLoading && !isAdmin) navigate({ to: "/dashboard" }); }, [authLoading, isAdmin, navigate]);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from("courses").select("*").order("sort_order"),
      supabase.from("spaces").select("*").eq("is_archived", false).order("sort_order"),
    ]);
    setCourses((c ?? []) as Course[]);
    setSpaces((s ?? []) as Space[]);
    setLoading(false);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const spacesById = useMemo(() => new Map(spaces.map((s) => [s.id, s])), [spaces]);
  const filtered = useMemo(() => {
    let arr = courses.slice();
    if (spaceFilter !== "all") arr = arr.filter((c) => c.space_id === spaceFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((c) => c.title.toLowerCase().includes(q) || (c.description?.toLowerCase().includes(q) ?? false));
    }
    return arr;
  }, [courses, spaceFilter, search]);

  const reorder = async (course: Course, dir: -1 | 1) => {
    const { error } = await supabase.from("courses").update({ sort_order: course.sort_order + dir }).eq("id", course.id);
    if (error) return toast.error(error.message);
    load();
  };
  const toggleArchive = async (course: Course) => {
    const { error } = await supabase.from("courses").update({ is_archived: !course.is_archived }).eq("id", course.id);
    if (error) return toast.error(error.message);
    toast.success(course.is_archived ? "Course restored" : "Course archived");
    load();
  };
  const remove = async (course: Course) => {
    if (!confirm(`Delete "${course.title}" and all its lessons?`)) return;
    const { error } = await supabase.from("courses").delete().eq("id", course.id);
    if (error) return toast.error(error.message);
    toast.success("Course deleted");
    load();
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Courses</h1>
          <p className="text-muted-foreground mt-1">Create courses, structure them into sections, and add lessons.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link to="/admin/ai-course-builder"><Sparkles className="size-4 mr-1.5" />Generate Course with AI</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/ai-course-builder"><Sparkles className="size-4 mr-1.5" />Generate Lesson Draft</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/ai-course-generations"><History className="size-4 mr-1.5" />AI Generations</Link></Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="size-4 mr-1.5" />New course
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses…" maxLength={100} />
        </div>
        <Select value={spaceFilter} onValueChange={setSpaceFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Spaces</SelectItem>
            {spaces.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<BookOpen className="size-5" />} title="No courses yet" description="Create your first course to get started."
          action={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="size-4 mr-1.5" />New course</Button>} />
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => (
            <li key={c.id}>
              <Card className="rounded-2xl">
                <CardContent className="pt-5 flex flex-wrap items-center gap-3">
                  <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                    <BookOpen className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium truncate">{c.title}</p>
                      <span className="text-[11px] rounded-full bg-muted text-muted-foreground px-2 py-0.5">{COURSE_ACCESS_LABELS[c.access_level]}</span>
                      <span className="text-[11px] rounded-full bg-muted text-muted-foreground px-2 py-0.5">{COURSE_VISIBILITY_LABELS[c.visibility]}</span>
                      {c.is_archived && <span className="text-[11px] rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5">Archived</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{spacesById.get(c.space_id)?.name ?? "—"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => reorder(c, -1)} title="Move up"><ChevronUp className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => reorder(c, 1)} title="Move down"><ChevronDown className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setFormOpen(true); }} title="Edit"><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" asChild title="Builder">
                      <Link to="/admin/courses/$courseId" params={{ courseId: c.id }}><Settings2 className="size-4" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleArchive(c)} title={c.is_archived ? "Restore" : "Archive"}>
                      {c.is_archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(c)} title="Delete"><Trash2 className="size-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <AdminCourseForm open={formOpen} onOpenChange={setFormOpen} initial={editing} spaces={spaces} onSaved={load} />
    </div>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchMember, fetchActivity, formatJoined, type MemberSummary, type ActivitySummary } from "@/lib/members";
import { ProfileHeader } from "@/components/members/ProfileHeader";
import { ProfileActivitySummary } from "@/components/members/ProfileActivitySummary";
import { MemberAchievementPanel } from "@/components/gamification/MemberAchievementPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users2 } from "lucide-react";
import type { Space } from "@/lib/spaces";
import type { Course, Lesson, LessonProgress } from "@/lib/courses";

export const Route = createFileRoute("/_authenticated/members/$userId")({
  component: MemberDetail,
});

function MemberDetail() {
  const { userId } = Route.useParams();
  const { user, isAdmin } = useAuth();
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [activity, setActivity] = useState<ActivitySummary | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [posts, setPosts] = useState<{ id: string; title: string | null; body: string; created_at: string }[]>([]);
  const [inProgress, setInProgress] = useState<{ course: Course; lesson: Lesson; progress: LessonProgress }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [m, a, { data: memRows }, { data: postRows }, { data: progRows }] = await Promise.all([
        fetchMember(userId),
        fetchActivity(userId),
        supabase.from("space_members").select("space_id, spaces(*)").eq("user_id", userId).eq("status", "active"),
        supabase.from("posts").select("id,title,body,created_at").eq("author_id", userId).eq("status", "active").order("created_at", { ascending: false }).limit(5),
        supabase.from("lesson_progress").select("*").eq("user_id", userId).order("last_viewed_at", { ascending: false }).limit(5),
      ]);
      setMember(m);
      setActivity(a);
      setSpaces(((memRows ?? []) as any[]).map((r) => r.spaces).filter(Boolean) as Space[]);
      setPosts((postRows ?? []) as any);

      const progress = (progRows ?? []) as LessonProgress[];
      if (progress.length > 0) {
        const lessonIds = progress.map((p) => p.lesson_id);
        const { data: ls } = await supabase.from("lessons").select("*").in("id", lessonIds);
        const courseIds = Array.from(new Set((ls ?? []).map((l: any) => l.course_id)));
        const { data: cs } = await supabase.from("courses").select("*").in("id", courseIds);
        const byLesson = new Map<string, Lesson>(((ls ?? []) as any[]).map((l) => [l.id, l as Lesson]));
        const byCourse = new Map<string, Course>(((cs ?? []) as any[]).map((c) => [c.id, c as Course]));
        const combos = progress
          .map((p) => {
            const lesson = byLesson.get(p.lesson_id);
            if (!lesson) return null;
            const course = byCourse.get(lesson.course_id);
            if (!course) return null;
            return { course, lesson, progress: p };
          })
          .filter(Boolean) as { course: Course; lesson: Lesson; progress: LessonProgress }[];
        setInProgress(combos.slice(0, 4));
      } else {
        setInProgress([]);
      }
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <div className="space-y-6"><Skeleton className="h-72 rounded-3xl" /><Skeleton className="h-32 rounded-2xl" /></div>;
  if (!member) return <p className="text-muted-foreground">Member not found.</p>;

  const isSelf = user?.id === member.id;

  return (
    <div className="space-y-6">
      <ProfileHeader member={member} isSelf={isSelf} isAdmin={isAdmin} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activity && <ProfileActivitySummary data={activity} />}
          <MemberAchievementPanel userId={member.id} />

          <Card className="rounded-2xl">
            <CardHeader><CardTitle>Recent posts</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No posts yet.</p>
              ) : posts.map((p) => (
                <Link key={p.id} to="/posts/$postId" params={{ postId: p.id }} className="block rounded-xl border p-3 hover:bg-accent transition-colors">
                  {p.title && <p className="font-medium">{p.title}</p>}
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(p.created_at).toLocaleDateString()}</p>
                </Link>
              ))}
            </CardContent>
          </Card>

          {inProgress.length > 0 && (
            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Courses in progress</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {inProgress.map(({ course, lesson, progress }) => (
                  <div key={progress.id} className="rounded-xl border p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{course.title}</p>
                      <p className="text-xs text-muted-foreground truncate">Lesson: {lesson.title} • {progress.status.replace("_", " ")}</p>
                    </div>
                    {isSelf && (
                      <Button asChild size="sm" variant="outline"><Link to="/lessons/$lessonId" params={{ lessonId: lesson.id }}>Open</Link></Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Joined</span><span>{formatJoined(member.created_at)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Lessons done</span><span>{activity?.lessons_completed ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Events RSVPed</span><span>{activity?.events_rsvped ?? 0}</span></div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users2 className="size-4" />Spaces ({spaces.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {spaces.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not in any Spaces yet.</p>
              ) : spaces.map((s) => (
                <Link key={s.id} to="/spaces/$spaceId" params={{ spaceId: s.id }} className="block rounded-lg px-3 py-2 hover:bg-accent transition-colors text-sm">
                  {s.name}
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="size-4" />Last active</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {member.last_active_at ? new Date(member.last_active_at).toLocaleString() : "Not yet recorded"}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
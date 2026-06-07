import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, FileText, GraduationCap, Users2, Bookmark, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { SavedItem, SavedTargetType } from "@/lib/onboarding";

interface ResolvedItem extends SavedItem {
  title: string;
  subtitle?: string | null;
  href?: { to: string; params?: any } | null;
}

async function resolveSavedItems(items: SavedItem[]): Promise<ResolvedItem[]> {
  const grouped: Record<SavedTargetType, string[]> = {
    post: [], course: [], lesson: [], event: [], space: [], resource_placeholder: [],
  };
  items.forEach((it) => { grouped[it.target_type]?.push(it.target_id); });
  const [posts, courses, lessons, events, spaces] = await Promise.all([
    grouped.post.length ? supabase.from("posts").select("id,title,body").in("id", grouped.post) : Promise.resolve({ data: [] as any[] }),
    grouped.course.length ? supabase.from("courses").select("id,title,description").in("id", grouped.course) : Promise.resolve({ data: [] as any[] }),
    grouped.lesson.length ? supabase.from("lessons").select("id,title,course_id").in("id", grouped.lesson) : Promise.resolve({ data: [] as any[] }),
    grouped.event.length ? (supabase as any).from("events").select("id,title,start_time").in("id", grouped.event) : Promise.resolve({ data: [] as any[] }),
    grouped.space.length ? supabase.from("spaces").select("id,name,tagline").in("id", grouped.space) : Promise.resolve({ data: [] as any[] }),
  ]);
  const map = new Map<string, any>();
  (posts.data ?? []).forEach((p: any) => map.set(`post:${p.id}`, { title: p.title || (p.body?.slice(0, 60) ?? "Untitled post"), href: { to: "/posts/$postId", params: { postId: p.id } } }));
  (courses.data ?? []).forEach((c: any) => map.set(`course:${c.id}`, { title: c.title, subtitle: c.description, href: { to: "/courses/$courseId", params: { courseId: c.id } } }));
  (lessons.data ?? []).forEach((l: any) => map.set(`lesson:${l.id}`, { title: l.title, href: { to: "/lessons/$lessonId", params: { lessonId: l.id } } }));
  (events.data ?? []).forEach((e: any) => map.set(`event:${e.id}`, { title: e.title, subtitle: new Date(e.start_time).toLocaleString(), href: { to: "/events/$eventId", params: { eventId: e.id } } }));
  (spaces.data ?? []).forEach((s: any) => map.set(`space:${s.id}`, { title: s.name, subtitle: s.tagline, href: { to: "/spaces/$spaceId", params: { spaceId: s.id } } }));

  return items.map((it) => {
    const found = map.get(`${it.target_type}:${it.target_id}`);
    return {
      ...it,
      title: found?.title ?? (it.target_type === "resource_placeholder" ? "Saved resource" : "Removed item"),
      subtitle: found?.subtitle ?? null,
      href: found?.href ?? null,
    };
  });
}

const ICONS: Record<SavedTargetType, any> = {
  post: FileText, course: GraduationCap, lesson: BookOpen, event: Calendar, space: Users2, resource_placeholder: Bookmark,
};

const LABELS: Record<SavedTargetType, string> = {
  post: "Post", course: "Course", lesson: "Lesson", event: "Event", space: "Space", resource_placeholder: "Resource",
};

export function SavedItemsList({ items, onUnsave }: { items: SavedItem[]; onUnsave?: () => void }) {
  const [resolved, setResolved] = useState<ResolvedItem[]>([]);
  useEffect(() => { resolveSavedItems(items).then(setResolved); }, [items.map((i) => i.id).join(",")]);

  const remove = async (it: SavedItem) => {
    const { error } = await supabase.from("saved_items").delete().eq("id", it.id);
    if (error) return toast.error(error.message);
    toast.success("Removed from saved");
    onUnsave?.();
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {resolved.map((it) => {
        const Icon = ICONS[it.target_type];
        return (
          <Card key={it.id} className="rounded-2xl">
            <CardContent className="pt-5 flex items-start gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <Icon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{LABELS[it.target_type]}</div>
                <div className="font-medium truncate">{it.title}</div>
                {it.subtitle && <p className="text-xs text-muted-foreground line-clamp-2">{it.subtitle}</p>}
                <div className="mt-2 flex gap-2">
                  {it.href ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link to={it.href.to} params={it.href.params}>Open <ArrowRight className="size-3.5 ml-1" /></Link>
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => remove(it)}>
                    <Trash2 className="size-3.5 mr-1.5" />Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
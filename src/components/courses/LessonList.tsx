import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Lock, Eye } from "lucide-react";
import { lessonStatusIcon, type Lesson, type CourseSection, type LessonProgress } from "@/lib/courses";

export function LessonList({
  sections,
  lessons,
  progressByLesson,
  currentLessonId,
}: {
  sections: CourseSection[];
  lessons: Lesson[];
  progressByLesson: Map<string, LessonProgress>;
  currentLessonId?: string;
}) {
  // Group lessons by section, with an "Ungrouped" bucket for null section.
  const bySection = new Map<string | null, Lesson[]>();
  lessons.forEach((l) => {
    const k = l.section_id;
    const arr = bySection.get(k) ?? [];
    arr.push(l);
    bySection.set(k, arr);
  });
  for (const arr of bySection.values()) arr.sort((a, b) => a.sort_order - b.sort_order);

  const ordered: { section: CourseSection | null; items: Lesson[] }[] = sections
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => ({ section: s, items: bySection.get(s.id) ?? [] }));

  const ungrouped = bySection.get(null);
  if (ungrouped?.length) ordered.push({ section: null, items: ungrouped });

  return (
    <div className="space-y-6">
      {ordered.map(({ section, items }, idx) => (
        <div key={section?.id ?? `none-${idx}`} className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {section ? section.title : "Lessons"}
          </h3>
          {section?.description && <p className="text-sm text-muted-foreground -mt-1">{section.description}</p>}
          <ul className="divide-y divide-border rounded-2xl border border-border overflow-hidden bg-card">
            {items.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">No lessons in this section yet.</li>
            ) : (
              items.map((l) => {
                const progress = progressByLesson.get(l.id);
                const Icon = lessonStatusIcon(progress?.status);
                const isCurrent = currentLessonId === l.id;
                const locked = l.visibility === "locked";
                const isPreview = l.visibility === "preview" || l.preview_enabled;
                return (
                  <li key={l.id}>
                    <Link
                      to="/lessons/$lessonId"
                      params={{ lessonId: l.id }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                        isCurrent ? "bg-primary/5" : "hover:bg-accent"
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", progress?.status === "completed" ? "text-emerald-500" : "text-muted-foreground")} />
                      <span className={cn("flex-1 truncate", locked && "text-muted-foreground")}>{l.title}</span>
                      {locked && (
                        <span className="text-[10px] uppercase rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground inline-flex items-center gap-1">
                          <Lock className="size-3" />Locked
                        </span>
                      )}
                      {!locked && isPreview && (
                        <span className="text-[10px] uppercase rounded-full bg-primary/10 text-primary px-1.5 py-0.5 inline-flex items-center gap-1">
                          <Eye className="size-3" />Preview
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
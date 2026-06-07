import { Progress } from "@/components/ui/progress";
import { progressPercent } from "@/lib/courses";

export function CourseProgressBar({ total, completed, showLabel = true }: { total: number; completed: number; showLabel?: boolean }) {
  const pct = progressPercent(total, completed);
  return (
    <div className="space-y-1">
      <Progress value={pct} className="h-2" />
      {showLabel && (
        <p className="text-xs text-muted-foreground">
          {completed} of {total} {total === 1 ? "lesson" : "lessons"} · {pct}%
        </p>
      )}
    </div>
  );
}
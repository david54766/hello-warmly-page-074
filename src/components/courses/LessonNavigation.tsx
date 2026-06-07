import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

export function LessonNavigation({
  courseId,
  prevId,
  nextId,
}: {
  courseId: string;
  prevId?: string | null;
  nextId?: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/courses/$courseId" params={{ courseId }}>
          <ArrowLeft className="size-4 mr-1.5" />Back to course
        </Link>
      </Button>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={!prevId} asChild={!!prevId}>
          {prevId ? (
            <Link to="/lessons/$lessonId" params={{ lessonId: prevId }}>
              <ChevronLeft className="size-4 mr-1" />Previous
            </Link>
          ) : (
            <span><ChevronLeft className="size-4 mr-1" />Previous</span>
          )}
        </Button>
        <Button variant="outline" size="sm" disabled={!nextId} asChild={!!nextId}>
          {nextId ? (
            <Link to="/lessons/$lessonId" params={{ lessonId: nextId }}>
              Next<ChevronRight className="size-4 ml-1" />
            </Link>
          ) : (
            <span>Next<ChevronRight className="size-4 ml-1" /></span>
          )}
        </Button>
      </div>
    </div>
  );
}
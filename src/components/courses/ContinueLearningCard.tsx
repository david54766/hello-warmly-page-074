import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Play, Sparkles, ArrowRight } from "lucide-react";
import { CourseProgressBar } from "./CourseProgressBar";
import type { Course, Lesson } from "@/lib/courses";

export function ContinueLearningCard({
  course,
  lesson,
  total,
  completed,
}: {
  course: Course;
  lesson: Lesson;
  total: number;
  completed: number;
}) {
  return (
    <Card className="rounded-2xl overflow-hidden">
      <div className="grid sm:grid-cols-[180px_1fr]">
        <div className="aspect-video sm:aspect-auto bg-gradient-to-br from-primary/20 via-primary/5 to-background grid place-items-center">
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt="" className="size-full object-cover" />
          ) : (
            <BookOpen className="size-10 text-primary/40" />
          )}
        </div>
        <CardContent className="pt-5 space-y-3">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Continue learning</p>
            <h3 className="font-semibold leading-tight">{course.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">Up next: {lesson.title}</p>
          </div>
          <CourseProgressBar total={total} completed={completed} />
          <Button size="sm" asChild>
            <Link to="/lessons/$lessonId" params={{ lessonId: lesson.id }}>
              <Play className="size-4 mr-1.5" />Continue
            </Link>
          </Button>
        </CardContent>
      </div>
    </Card>
  );
}

export function SuggestedCoursesCard() {
  return (
    <Card className="rounded-2xl">
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4" />Suggested for you
        </div>
        <h3 className="font-semibold">Start with a course from the library</h3>
        <p className="text-sm text-muted-foreground">
          Browse free and preview courses to pick one that fits your goals.
        </p>
        <Button size="sm" variant="outline" asChild>
          <Link to="/courses">Open Course Library <ArrowRight className="size-4 ml-1" /></Link>
        </Button>
      </CardContent>
    </Card>
  );
}
import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Lock, Play, ArrowRight } from "lucide-react";
import { COURSE_ACCESS_LABELS, isCourseLocked, type Course } from "@/lib/courses";
import { CourseProgressBar } from "./CourseProgressBar";
import { SaveButton } from "@/components/onboarding/SaveButton";

export function CourseCard({
  course,
  spaceName,
  lessonCount,
  completedCount,
}: {
  course: Course;
  spaceName?: string;
  lessonCount: number;
  completedCount: number;
}) {
  const locked = isCourseLocked(course);
  const started = completedCount > 0;
  return (
    <Card className="rounded-2xl overflow-hidden flex flex-col">
      <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 via-primary/5 to-background relative">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-primary/40">
            <BookOpen className="size-12" />
          </div>
        )}
        <span className="absolute top-3 left-3 text-[11px] rounded-full bg-background/90 backdrop-blur px-2 py-0.5 font-medium">
          {COURSE_ACCESS_LABELS[course.access_level]}
        </span>
        {locked && (
          <span className="absolute top-3 right-3 size-7 rounded-full bg-background/90 backdrop-blur grid place-items-center">
            <Lock className="size-3.5" />
          </span>
        )}
      </div>
      <CardContent className="pt-5 space-y-3 flex-1 flex flex-col">
        <div className="space-y-1 flex-1">
          {spaceName && <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{spaceName}</p>}
          <h3 className="font-semibold leading-tight line-clamp-2">{course.title}</h3>
          {course.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
          )}
        </div>
        <CourseProgressBar total={lessonCount} completed={completedCount} />
        <div className="flex items-center gap-2">
          <Button variant={started ? "default" : "outline"} size="sm" asChild className="flex-1">
            <Link to="/courses/$courseId" params={{ courseId: course.id }}>
              {locked ? (
                <>Preview <ArrowRight className="size-4 ml-1" /></>
              ) : started ? (
                <><Play className="size-4 mr-1.5" />Continue</>
              ) : (
                <>View course <ArrowRight className="size-4 ml-1" /></>
              )}
            </Link>
          </Button>
          <SaveButton targetType="course" targetId={course.id} />
        </div>
      </CardContent>
    </Card>
  );
}
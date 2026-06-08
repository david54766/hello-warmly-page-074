import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Circle, Lock, PlayCircle, Eye } from "lucide-react";

export type CourseVisibility = "public" | "members_only" | "space_members" | "hidden";
export type CourseAccess = "free" | "preview" | "paid" | "paid_placeholder";
export type LessonVisibility = "visible" | "preview" | "locked" | "hidden";
export type LessonProgressStatus = "not_started" | "in_progress" | "completed";

export interface Course {
  id: string;
  space_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  overview_content: string | null;
  created_by: string | null;
  visibility: CourseVisibility;
  access_level: CourseAccess;
  sort_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  section_id: string | null;
  title: string;
  content: string;
  video_url: string | null;
  attachments: string[];
  sort_order: number;
  preview_enabled: boolean;
  completion_required: boolean;
  visibility: LessonVisibility;
  created_at: string;
  updated_at: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  status: LessonProgressStatus;
  completed_at: string | null;
  last_viewed_at: string;
  created_at: string;
  updated_at: string;
}

export const COURSE_ACCESS_LABELS: Record<CourseAccess, string> = {
  free: "Free",
  preview: "Preview",
  paid: "Paid",
  paid_placeholder: "Paid",
};

export const COURSE_VISIBILITY_LABELS: Record<CourseVisibility, string> = {
  public: "Public",
  members_only: "Members only",
  space_members: "Space members",
  hidden: "Hidden",
};

export const LESSON_VISIBILITY_LABELS: Record<LessonVisibility, string> = {
  visible: "Visible",
  preview: "Preview",
  locked: "Locked",
  hidden: "Hidden",
};

export function isCourseLocked(c: Pick<Course, "access_level">) {
  return c.access_level === "paid" || c.access_level === "paid_placeholder";
}

export function isLessonLocked(l: Pick<Lesson, "visibility">) {
  return l.visibility === "locked";
}

export function lessonStatusIcon(s: LessonProgressStatus | undefined): LucideIcon {
  if (s === "completed") return CheckCircle2;
  if (s === "in_progress") return PlayCircle;
  return Circle;
}

export function progressPercent(total: number, completed: number) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function lessonBadgeIcon(l: Pick<Lesson, "visibility" | "preview_enabled">): { icon: LucideIcon; label: string } | null {
  if (l.visibility === "locked") return { icon: Lock, label: "Locked" };
  if (l.visibility === "preview" || l.preview_enabled) return { icon: Eye, label: "Preview" };
  return null;
}
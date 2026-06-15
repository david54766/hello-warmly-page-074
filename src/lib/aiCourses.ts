import { supabase } from "@/integrations/supabase/client";
import { logUsage as _logBaseUsage } from "@/lib/ai";

const db = supabase as any;

export type GenerationStatus = "draft" | "generated" | "converted" | "archived" | "failed";
export type SkillLevel = "beginner" | "intermediate" | "advanced" | "mixed";
export type Tone = "professional" | "friendly" | "coaching" | "academic" | "simple" | "motivational";
export type Difficulty = "easy" | "medium" | "hard";

export const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "mixed", label: "Mixed" },
];
export const TONES: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "coaching", label: "Coaching" },
  { value: "academic", label: "Academic" },
  { value: "simple", label: "Simple" },
  { value: "motivational", label: "Motivational" },
];
export const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export const STATUS_LABELS: Record<GenerationStatus, string> = {
  draft: "Draft",
  generated: "Generated",
  converted: "Converted",
  archived: "Archived",
  failed: "Failed",
};

// ---------- Types ----------
export interface OutlineLesson {
  title: string;
  description: string;
  suggested_activity?: string;
  suggested_resource?: string;
  suggested_quiz_topic?: string;
}
export interface OutlineSection {
  title: string;
  description: string;
  lessons: OutlineLesson[];
}
export interface CourseOutline {
  course_title: string;
  course_description: string;
  course_outcome: string;
  sections: OutlineSection[];
}

export interface AICourseGeneration {
  id: string;
  user_id: string;
  title: string;
  topic: string;
  audience: string | null;
  skill_level: SkillLevel | null;
  desired_outcome: string | null;
  sections_count: number;
  lessons_per_section: number;
  tone: Tone | null;
  additional_instructions: string | null;
  status: GenerationStatus;
  generated_outline_json: CourseOutline;
  created_course_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LessonGenerationContent {
  lesson_title: string;
  lesson_content: string;
  key_takeaways: string[];
  action_steps: string[];
  discussion_question: string;
  suggested_resources: string[];
  quiz_questions?: { question: string; options: string[]; correct: number }[];
}

export interface AILessonGeneration {
  id: string;
  user_id: string;
  course_id: string | null;
  section_id: string | null;
  lesson_id: string | null;
  topic: string;
  audience: string | null;
  tone: Tone | null;
  desired_length: string | null;
  key_points: string | null;
  call_to_action: string | null;
  include_summary: boolean;
  include_quiz: boolean;
  status: GenerationStatus;
  generated_content: LessonGenerationContent;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}
export interface QuizContent {
  title: string;
  questions: QuizQuestion[];
}

export interface AIQuizGeneration {
  id: string;
  user_id: string;
  course_id: string | null;
  lesson_id: string | null;
  topic: string;
  question_count: number;
  difficulty: Difficulty;
  multiple_choice: boolean;
  status: GenerationStatus;
  generated_quiz_json: QuizContent;
  created_at: string;
  updated_at: string;
}

// ---------- Mock generators ----------
export function mockOutline(input: {
  topic: string; audience?: string; skill_level?: SkillLevel; desired_outcome?: string;
  sections_count: number; lessons_per_section: number; tone?: Tone;
}): CourseOutline {
  const topic = input.topic.trim() || "your topic";
  const sections: OutlineSection[] = Array.from({ length: input.sections_count }).map((_, i) => ({
    title: `Module ${i + 1}: ${capitalize(topic)} — Part ${i + 1}`,
    description: `Foundational concepts and practical examples for part ${i + 1} of ${topic}.`,
    lessons: Array.from({ length: input.lessons_per_section }).map((__, j) => ({
      title: `Lesson ${j + 1}: Key idea ${j + 1} of module ${i + 1}`,
      description: `Short, practical lesson that introduces idea ${j + 1} in module ${i + 1} with examples.`,
      suggested_activity: `Try a quick exercise applying idea ${j + 1} to your own context.`,
      suggested_resource: `Recommended article or video about ${topic}.`,
      suggested_quiz_topic: `Quick check: idea ${j + 1} fundamentals.`,
    })),
  }));
  return {
    course_title: `${capitalize(topic)} — A Practical Course`,
    course_description: `A hands-on course on ${topic}${input.audience ? ` for ${input.audience}` : ""}. Designed for ${input.skill_level ?? "mixed"} learners.`,
    course_outcome: input.desired_outcome || `By the end, learners will confidently apply ${topic} in real situations.`,
    sections,
  };
}

export function mockLesson(input: {
  topic: string; audience?: string; tone?: Tone; desired_length?: string;
  key_points?: string; call_to_action?: string; include_summary: boolean; include_quiz: boolean;
}): LessonGenerationContent {
  const topic = input.topic.trim() || "your topic";
  const points = (input.key_points ?? "").split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  return {
    lesson_title: `Learn the essentials of ${capitalize(topic)}`,
    lesson_content: `In this lesson we explore ${topic}. We'll cover what it is, why it matters${input.audience ? ` for ${input.audience}` : ""}, and how to apply it.\n\n` +
      (points.length ? `Key concepts:\n${points.map((p) => `• ${p}`).join("\n")}\n\n` : "") +
      `Walkthrough:\n1. Define the core idea.\n2. See a clear example.\n3. Practice with a quick exercise.\n4. Reflect on what changed.`,
    key_takeaways: input.include_summary ? [
      `Understand what ${topic} is and when to use it.`,
      `Apply ${topic} in a practical context.`,
      `Avoid the most common mistakes.`,
    ] : [],
    action_steps: [
      input.call_to_action?.trim() || `Try one small action related to ${topic} this week.`,
      `Share your result with the community.`,
    ],
    discussion_question: `Where in your work could ${topic} help most right now?`,
    suggested_resources: [`Recommended reading on ${topic}`, `Short video walkthrough`],
    quiz_questions: input.include_quiz ? [
      { question: `Which best describes ${topic}?`, options: ["Option A", "Option B", "Option C"], correct: 0 },
    ] : undefined,
  };
}

export function mockQuiz(input: { topic: string; question_count: number; difficulty: Difficulty; multiple_choice: boolean }): QuizContent {
  const topic = input.topic.trim() || "your topic";
  const questions: QuizQuestion[] = Array.from({ length: input.question_count }).map((_, i) => ({
    question: `(${input.difficulty}) Q${i + 1}: Which statement about ${topic} is most accurate?`,
    options: input.multiple_choice
      ? [`Correct take on ${topic}`, `Common misconception A`, `Common misconception B`, `Unrelated answer`]
      : ["True", "False"],
    correct_index: 0,
    explanation: `The first option reflects the core idea of ${topic} accurately.`,
  }));
  return { title: `Quick quiz: ${capitalize(topic)}`, questions };
}

export function mockAssignment(type: AssignmentType, topic: string): string {
  const t = topic.trim() || "the lesson topic";
  switch (type) {
    case "reflection": return `Reflection: What surprised you most about ${t}? Write 3–5 sentences.`;
    case "homework": return `Homework: Apply ${t} in one real scenario this week and document what happened.`;
    case "discussion": return `Discussion prompt: How does ${t} change the way you think about your work?`;
    case "worksheet": return `Worksheet outline:\n1. Define ${t}\n2. Give an example\n3. Identify a risk\n4. Plan one next step`;
    case "checklist": return `Implementation checklist:\n☐ Read the lesson\n☐ Try one example of ${t}\n☐ Share progress\n☐ Note one improvement`;
  }
}

export type AssignmentType = "reflection" | "homework" | "discussion" | "worksheet" | "checklist";

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ---------- CRUD: course generations ----------
export async function createCourseGeneration(input: {
  topic: string; audience?: string; skill_level?: SkillLevel; desired_outcome?: string;
  sections_count: number; lessons_per_section: number; tone?: Tone; additional_instructions?: string;
  outline: CourseOutline;
}): Promise<AICourseGeneration> {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await db.from("ai_course_generations").insert({
    user_id: u.user?.id,
    title: input.outline.course_title || "Untitled course outline",
    topic: input.topic,
    audience: input.audience ?? null,
    skill_level: input.skill_level ?? null,
    desired_outcome: input.desired_outcome ?? null,
    sections_count: input.sections_count,
    lessons_per_section: input.lessons_per_section,
    tone: input.tone ?? null,
    additional_instructions: input.additional_instructions ?? null,
    status: "generated",
    generated_outline_json: input.outline,
  }).select().single();
  if (error) throw error;
  await logCourseUsage("course_outline_generated");
  return data as AICourseGeneration;
}

export async function listCourseGenerations(): Promise<AICourseGeneration[]> {
  const { data } = await db.from("ai_course_generations").select("*").order("created_at", { ascending: false });
  return (data ?? []) as AICourseGeneration[];
}
export async function getCourseGeneration(id: string): Promise<AICourseGeneration | null> {
  const { data } = await db.from("ai_course_generations").select("*").eq("id", id).maybeSingle();
  return (data as AICourseGeneration) ?? null;
}
export async function updateCourseGeneration(id: string, patch: Partial<AICourseGeneration>) {
  const { error } = await db.from("ai_course_generations").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
export async function archiveCourseGeneration(id: string) {
  await updateCourseGeneration(id, { status: "archived" });
  await logCourseUsage("generation_archived");
}

/** Convert outline → courses/sections/lessons. */
export async function convertOutlineToCourse(generation: AICourseGeneration, opts: {
  space_id: string;
  visibility: "public" | "members_only" | "space_members" | "hidden";
  access_level: "free" | "preview" | "paid" | "paid_placeholder";
}): Promise<string> {
  const outline = generation.generated_outline_json;
  const { data: u } = await supabase.auth.getUser();
  const { data: course, error: cErr } = await db.from("courses").insert({
    space_id: opts.space_id,
    title: outline.course_title.slice(0, 200),
    description: outline.course_description?.slice(0, 2000) ?? null,
    overview_content: outline.course_outcome ?? null,
    created_by: u.user?.id,
    visibility: opts.visibility,
    access_level: opts.access_level,
    sort_order: 0,
    is_archived: false,
  }).select("id").single();
  if (cErr) throw cErr;
  const courseId = course.id as string;

  // Insert sections + lessons sequentially to keep order.
  for (let i = 0; i < outline.sections.length; i++) {
    const s = outline.sections[i];
    const { data: secRow, error: sErr } = await db.from("course_sections").insert({
      course_id: courseId, title: s.title.slice(0, 200), description: s.description?.slice(0, 1000) ?? null, sort_order: i,
    }).select("id").single();
    if (sErr) throw sErr;
    for (let j = 0; j < s.lessons.length; j++) {
      const l = s.lessons[j];
      await db.from("lessons").insert({
        course_id: courseId,
        section_id: secRow.id,
        title: l.title.slice(0, 200),
        content: [l.description, l.suggested_activity ? `\n\nActivity: ${l.suggested_activity}` : "", l.suggested_resource ? `\n\nResource: ${l.suggested_resource}` : ""].join(""),
        attachments: [],
        sort_order: j,
        preview_enabled: false,
        completion_required: true,
        visibility: "hidden", // safe: admins review before publishing
      });
    }
  }
  await updateCourseGeneration(generation.id, { status: "converted", created_course_id: courseId });
  // Audit + usage
  try {
    await db.rpc("log_audit", { _action: "ai_course_converted", _target_type: "course", _target_id: courseId, _metadata: { generation_id: generation.id } });
  } catch { /* optional */ }
  await logCourseUsage("course_outline_converted");
  return courseId;
}

// ---------- CRUD: lesson generations ----------
export async function createLessonGeneration(input: {
  topic: string; audience?: string; tone?: Tone; desired_length?: string;
  key_points?: string; call_to_action?: string; include_summary: boolean; include_quiz: boolean;
  course_id?: string | null; section_id?: string | null; lesson_id?: string | null;
  content: LessonGenerationContent;
}): Promise<AILessonGeneration> {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await db.from("ai_lesson_generations").insert({
    user_id: u.user?.id,
    course_id: input.course_id ?? null,
    section_id: input.section_id ?? null,
    lesson_id: input.lesson_id ?? null,
    topic: input.topic,
    audience: input.audience ?? null,
    tone: input.tone ?? null,
    desired_length: input.desired_length ?? null,
    key_points: input.key_points ?? null,
    call_to_action: input.call_to_action ?? null,
    include_summary: input.include_summary,
    include_quiz: input.include_quiz,
    status: "generated",
    generated_content: input.content,
  }).select().single();
  if (error) throw error;
  await logCourseUsage("lesson_generated");
  return data as AILessonGeneration;
}
export async function listLessonGenerations(): Promise<AILessonGeneration[]> {
  const { data } = await db.from("ai_lesson_generations").select("*").order("created_at", { ascending: false });
  return (data ?? []) as AILessonGeneration[];
}
export async function archiveLessonGeneration(id: string) {
  await db.from("ai_lesson_generations").update({ status: "archived", updated_at: new Date().toISOString() }).eq("id", id);
  await logCourseUsage("generation_archived");
}

// ---------- CRUD: quiz generations ----------
export async function createQuizGeneration(input: {
  topic: string; question_count: number; difficulty: Difficulty; multiple_choice: boolean;
  course_id?: string | null; lesson_id?: string | null; quiz: QuizContent;
}): Promise<AIQuizGeneration> {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await db.from("ai_quiz_generations").insert({
    user_id: u.user?.id,
    course_id: input.course_id ?? null,
    lesson_id: input.lesson_id ?? null,
    topic: input.topic,
    question_count: input.question_count,
    difficulty: input.difficulty,
    multiple_choice: input.multiple_choice,
    status: "generated",
    generated_quiz_json: input.quiz,
  }).select().single();
  if (error) throw error;
  await logCourseUsage("quiz_generated");
  return data as AIQuizGeneration;
}
export async function listQuizGenerations(): Promise<AIQuizGeneration[]> {
  const { data } = await db.from("ai_quiz_generations").select("*").order("created_at", { ascending: false });
  return (data ?? []) as AIQuizGeneration[];
}
export async function archiveQuizGeneration(id: string) {
  await db.from("ai_quiz_generations").update({ status: "archived", updated_at: new Date().toISOString() }).eq("id", id);
  await logCourseUsage("generation_archived");
}

// ---------- Usage logging (extends Phase 5A ai_usage_events) ----------
export type AICourseFeature =
  | "course_outline_generated"
  | "course_outline_converted"
  | "lesson_generated"
  | "quiz_generated"
  | "assignment_generated"
  | "generation_archived";

export async function logCourseUsage(feature: AICourseFeature, status: "ok" | "error" = "ok") {
  try {
    const { data: u } = await supabase.auth.getUser();
    await db.from("ai_usage_events").insert({ user_id: u.user?.id, feature_type: feature, status });
  } catch { /* best effort */ }
  void _logBaseUsage; // silence unused
}

export interface AICourseCounts {
  outlines: number;
  lessons: number;
  quizzes: number;
  converted: number;
}
export async function fetchAICourseCounts(): Promise<AICourseCounts> {
  const [{ count: outlines }, { count: lessons }, { count: quizzes }, { count: converted }] = await Promise.all([
    db.from("ai_course_generations").select("*", { count: "exact", head: true }),
    db.from("ai_lesson_generations").select("*", { count: "exact", head: true }),
    db.from("ai_quiz_generations").select("*", { count: "exact", head: true }),
    db.from("ai_course_generations").select("*", { count: "exact", head: true }).eq("status", "converted"),
  ]);
  return { outlines: outlines ?? 0, lessons: lessons ?? 0, quizzes: quizzes ?? 0, converted: converted ?? 0 };
}
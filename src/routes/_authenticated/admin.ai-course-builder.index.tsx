import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, History } from "lucide-react";
import { toast } from "sonner";
import { AICourseBuilderForm } from "@/components/ai/AICourseBuilderForm";
import { AILessonGeneratorForm } from "@/components/ai/AILessonGeneratorForm";
import { AILessonPreview } from "@/components/ai/AILessonPreview";
import { AIQuizGeneratorForm } from "@/components/ai/AIQuizGeneratorForm";
import { AIQuizPreview } from "@/components/ai/AIQuizPreview";
import { AIAssignmentGenerator } from "@/components/ai/AIAssignmentGenerator";
import { MockModeNotice } from "@/components/ai/MockModeNotice";
import { createCourseGeneration, createLessonGeneration, createQuizGeneration, getAISettingsIsMock, type LessonGenerationContent, type QuizContent } from "@/lib/aiCourses";

export const Route = createFileRoute("/_authenticated/admin/ai-course-builder/")({
  component: AICourseBuilderPage,
});

function AICourseBuilderPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [mock, setMock] = useState(true);
  const [lastLesson, setLastLesson] = useState<LessonGenerationContent | null>(null);
  const [lastQuiz, setLastQuiz] = useState<QuizContent | null>(null);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);
  useEffect(() => { getAISettingsIsMock().then(setMock); }, []);

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2"><Sparkles className="size-7 text-primary" />AI Course Builder</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">Generate course outlines, lesson drafts, quizzes, and learning activities faster while keeping full control before anything is published.</p>
        </div>
        <Button variant="outline" asChild><Link to="/admin/ai-course-generations"><History className="size-4 mr-1.5" />Generation history</Link></Button>
      </header>

      <MockModeNotice enabled={mock} />

      <Tabs defaultValue="course" className="space-y-4">
        <TabsList>
          <TabsTrigger value="course">Course outline</TabsTrigger>
          <TabsTrigger value="lesson">Lesson draft</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="assignment">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="course">
          <AICourseBuilderForm onGenerated={async (values, outline) => {
            try {
              const gen = await createCourseGeneration({ ...values, outline });
              toast.success("Outline generated — review it next");
              navigate({ to: "/admin/ai-course-builder/$generationId", params: { generationId: gen.id } });
            } catch (e: any) { toast.error(e?.message ?? "Failed to save generation"); }
          }} />
        </TabsContent>

        <TabsContent value="lesson" className="space-y-4">
          <AILessonGeneratorForm onGenerated={async (values, content) => {
            setLastLesson(content);
            try { await createLessonGeneration({ ...values, content }); toast.success("Lesson draft saved"); }
            catch (e: any) { toast.error(e?.message ?? "Failed to save"); }
          }} />
          {lastLesson && <AILessonPreview content={lastLesson} />}
        </TabsContent>

        <TabsContent value="quiz" className="space-y-4">
          <AIQuizGeneratorForm onGenerated={async (values, quiz) => {
            setLastQuiz(quiz);
            try { await createQuizGeneration({ ...values, quiz }); toast.success("Quiz draft saved"); }
            catch (e: any) { toast.error(e?.message ?? "Failed to save"); }
          }} />
          {lastQuiz && <AIQuizPreview quiz={lastQuiz} />}
        </TabsContent>

        <TabsContent value="assignment">
          <AIAssignmentGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
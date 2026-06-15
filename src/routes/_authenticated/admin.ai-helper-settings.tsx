import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AIHelperSettingsForm } from "@/components/ai/AIHelperSettingsForm";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ai-helper-settings")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/dashboard" }); }, [isAdmin, loading, nav]);
  if (!isAdmin) return null;
  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <h1 className="text-2xl font-semibold">AI Helper Settings</h1>
      </div>
      <p className="text-sm text-muted-foreground">Control the member-facing AI helper: which content it can use, its name, fallback messages, and instructions.</p>
      <AIHelperSettingsForm />
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AIDraftsTable } from "@/components/ai/AIDraftsTable";
import { archiveDraft, listDrafts, type AIGeneratedContent } from "@/lib/ai";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/ai-drafts/")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<AIGeneratedContent[]>([]);
  const refresh = () => listDrafts().then(setRows);
  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/dashboard" }); }, [isAdmin, loading, nav]);
  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);
  if (!isAdmin) return null;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">AI Drafts</h1>
        <p className="text-muted-foreground mt-1">Review, edit, archive, or publish AI-generated content drafts.</p>
      </header>
      <AIDraftsTable rows={rows} onArchive={async (id) => { await archiveDraft(id); toast.success("Archived"); refresh(); }} />
    </div>
  );
}
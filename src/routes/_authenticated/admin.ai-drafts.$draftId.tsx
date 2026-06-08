import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AIDraftEditor } from "@/components/ai/AIDraftEditor";
import { PublishDraftModal } from "@/components/ai/PublishDraftModal";
import { getDraft, publishDraftAsPost, updateDraft, type AIGeneratedContent } from "@/lib/ai";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/ai-drafts/$draftId")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const { draftId } = Route.useParams();
  const nav = useNavigate();
  const [draft, setDraft] = useState<AIGeneratedContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPublish, setShowPublish] = useState(false);

  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/dashboard" }); }, [isAdmin, loading, nav]);
  useEffect(() => { if (isAdmin) getDraft(draftId).then(setDraft); }, [isAdmin, draftId]);
  if (!isAdmin || !draft) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Edit AI draft</h1>
        <p className="text-muted-foreground mt-1 capitalize">Status: {draft.status}</p>
      </header>
      <AIDraftEditor
        draft={draft}
        saving={saving}
        onSave={async (patch) => {
          setSaving(true);
          try { await updateDraft(draft.id, patch); setDraft({ ...draft, ...patch }); toast.success("Saved"); }
          catch (e: any) { toast.error(e?.message ?? "Failed"); }
          finally { setSaving(false); }
        }}
        onPublish={() => setShowPublish(true)}
      />
      <PublishDraftModal
        open={showPublish}
        defaultTitle={draft.title}
        defaultBody={draft.body}
        onClose={() => setShowPublish(false)}
        onConfirm={async (spaceId, title, body) => {
          try {
            await publishDraftAsPost(draft.id, spaceId, title, body);
            toast.success("Published as post");
            setShowPublish(false);
            const next = await getDraft(draft.id); setDraft(next);
          } catch (e: any) { toast.error(e?.message ?? "Failed to publish"); }
        }}
      />
    </div>
  );
}
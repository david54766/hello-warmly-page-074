import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AIAssistantLayout } from "@/components/ai/AIAssistantLayout";
import { AIConversationSidebar } from "@/components/ai/AIConversationSidebar";
import { AIMessageBubble } from "@/components/ai/AIMessageBubble";
import { AIPromptInput } from "@/components/ai/AIPromptInput";
import { AISuggestedActionCard } from "@/components/ai/AISuggestedActionCard";
import { AIResponseActions } from "@/components/ai/AIResponseActions";
import { AIGeneratedPreview } from "@/components/ai/AIGeneratedPreview";
import { MockModeNotice } from "@/components/ai/MockModeNotice";
import { PublishDraftModal } from "@/components/ai/PublishDraftModal";
import { AIUsageCard } from "@/components/ai/AIUsageCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  addMessage, buildMockResponse, countUsage, createConversation, deleteConversation,
  fetchActivitySummary, fetchAtRiskMembers, getAISettings, isMockMode, listConversations,
  listMessages, logUsage, publishDraftAsPost, saveDraft, SUGGESTED_ACTIONS,
  type AIConversation, type AIMessage, type AISettings, type SuggestedAction,
} from "@/lib/ai";
import { toast } from "sonner";
import { Settings, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ai-assistant")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [lastAction, setLastAction] = useState<SuggestedAction | null>(null);
  const [lastResponse, setLastResponse] = useState<{ title: string; body: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [usage, setUsage] = useState({ total: 0, chat: 0, drafts: 0 });
  const [showPublish, setShowPublish] = useState(false);

  const mock = useMemo(() => isMockMode(settings), [settings]);

  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/dashboard" }); }, [isAdmin, loading, nav]);
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [s, convs, u] = await Promise.all([getAISettings(), listConversations(), countUsage()]);
      setSettings(s); setConversations(convs); setUsage(u);
      if (convs[0]) { setActiveId(convs[0].id); setMessages(await listMessages(convs[0].id)); }
    })();
  }, [isAdmin]);

  const select = async (id: string) => { setActiveId(id); setMessages(await listMessages(id)); setLastResponse(null); setLastAction(null); };
  const refreshUsage = () => countUsage().then(setUsage);

  const ensureConv = async (title?: string) => {
    if (activeId) return activeId;
    const c = await createConversation(title ?? "New conversation");
    setConversations((prev) => [c, ...prev]); setActiveId(c.id); setMessages([]);
    return c.id;
  };

  const handleSend = async (text: string, action?: SuggestedAction) => {
    setSending(true);
    try {
      const cid = await ensureConv(action?.title ?? text.slice(0, 40));
      const userMsg = await addMessage(cid, "user", text);
      setMessages((m) => [...m, userMsg]);
      await logUsage("assistant_chat");

      let body: string; let title: string;
      if (action?.id === "summary") {
        const s = await fetchActivitySummary();
        title = "Top activity this week";
        body = `Here is a summary based on platform data:\n• New members (7d): ${s.newMembers}\n• Posts (7d): ${s.activePosts}\n• Active Spaces: ${s.activeSpaces}\n• Upcoming events: ${s.upcomingEvents}\n• Open reports: ${s.openReports}`;
      } else if (action?.id === "reengage") {
        const at = await fetchAtRiskMembers();
        title = "Inactive members to re-engage";
        const names = at.slice(0, 5).map((m) => m.full_name ?? m.email ?? m.id).join(", ") || "no at-risk members detected";
        body = `Suggested outreach for: ${names}.\n\nSuggested message:\n"Hi! We miss you in the community. Here's a quick highlight of what you missed — we'd love to see you back."`;
      } else {
        const r = buildMockResponse(text, action?.contentType ?? "post");
        title = r.title; body = r.body;
      }

      if (mock) await logUsage("mock_response");
      const assistantMsg = await addMessage(cid, "assistant", body, { title, mock });
      setMessages((m) => [...m, assistantMsg]);
      setLastResponse({ title, body });
      setLastAction(action ?? null);
      refreshUsage();
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setSending(false); }
  };

  const handleAction = (a: SuggestedAction) => { logUsage("suggested_action"); handleSend(a.prompt, a); };

  if (!isAdmin) return null;

  const sidebar = (
    <AIConversationSidebar
      conversations={conversations}
      activeId={activeId}
      onSelect={select}
      onNew={async () => { const c = await createConversation(); setConversations((p) => [c, ...p]); setActiveId(c.id); setMessages([]); setLastResponse(null); }}
      onDelete={async (id) => { await deleteConversation(id); setConversations((p) => p.filter((x) => x.id !== id)); if (activeId === id) { setActiveId(null); setMessages([]); } toast.success("Conversation deleted"); }}
    />
  );

  const main = (
    <>
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{activeId ? conversations.find((c) => c.id === activeId)?.title : "Start a new conversation"}</h2>
          <p className="text-xs text-muted-foreground">AI must be reviewed before publishing. AI does not give legal, medical, or financial advice.</p>
        </div>
        <Button asChild variant="outline" size="sm"><Link to="/admin/ai-settings"><Settings className="size-4 mr-1.5" />Settings</Link></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <MockModeNotice enabled={mock} />
            <p className="text-sm font-medium text-muted-foreground">Suggested actions</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {SUGGESTED_ACTIONS.map((a) => <AISuggestedActionCard key={a.id} action={a} onClick={() => handleAction(a)} />)}
            </div>
          </div>
        ) : (
          <>
            {mock && <MockModeNotice enabled={mock} />}
            <div className="mt-2">{messages.map((m) => <AIMessageBubble key={m.id} message={m} />)}</div>
          </>
        )}
      </div>
      <AIPromptInput disabled={sending} onSend={(t) => handleSend(t)} />
    </>
  );

  const preview = (
    <>
      {lastResponse ? (
        <Card className="rounded-2xl">
          <CardContent className="pt-5 space-y-3">
            <AIGeneratedPreview title={lastResponse.title} body={lastResponse.body} />
            <AIResponseActions
              onCopy={() => { navigator.clipboard.writeText(`${lastResponse.title}\n\n${lastResponse.body}`); toast.success("Copied"); }}
              onSave={async () => { try { await saveDraft({ title: lastResponse.title, body: lastResponse.body, content_type: lastAction?.contentType ?? "post" }); toast.success("Saved as draft"); refreshUsage(); } catch (e: any) { toast.error(e?.message ?? "Failed"); } }}
              onRegenerate={() => toast.info("Regenerate (placeholder) — send a new prompt for now")}
              onPublish={() => setShowPublish(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl"><CardContent className="pt-5 text-sm text-muted-foreground">Generated content will appear here. You can copy, save as draft, regenerate, or publish as a post after review.</CardContent></Card>
      )}
      <AIUsageCard total={usage.total} chat={usage.chat} drafts={usage.drafts} />
      <Card className="rounded-2xl"><CardContent className="pt-5"><Button asChild variant="outline" className="w-full"><Link to="/admin/ai-drafts"><FileText className="size-4 mr-1.5" />Open AI drafts</Link></Button></CardContent></Card>
    </>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">AI Platform Assistant</h1>
        <p className="text-muted-foreground mt-1">Use AI to create content, summarize activity, improve engagement, and manage your community faster.</p>
      </header>
      <AIAssistantLayout sidebar={sidebar} main={main} preview={preview} />
      <PublishDraftModal
        open={showPublish}
        defaultTitle={lastResponse?.title ?? ""}
        defaultBody={lastResponse?.body ?? ""}
        onClose={() => setShowPublish(false)}
        onConfirm={async (spaceId, title, body) => {
          try {
            const draft = await saveDraft({ title, body, content_type: lastAction?.contentType ?? "post" });
            await publishDraftAsPost(draft.id, spaceId, title, body);
            toast.success("Published as post");
            setShowPublish(false);
            refreshUsage();
          } catch (e: any) { toast.error(e?.message ?? "Failed to publish"); }
        }}
      />
    </div>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AIHelperAccessGuard } from "@/components/ai/AIHelperAccessGuard";
import { MemberAIHelperLayout } from "@/components/ai/MemberAIHelperLayout";
import { MemberAIConversationSidebar } from "@/components/ai/MemberAIConversationSidebar";
import { MemberAIMessageBubble } from "@/components/ai/MemberAIMessageBubble";
import { MemberAIPromptInput } from "@/components/ai/MemberAIPromptInput";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  addMemberMessage, buildMemberAIAnswer, createMemberConversation,
  deleteMemberConversation, getHelperSettings, listMemberConversations, listMemberMessages,
  type AIHelperSettings, type MemberAIConversation, type MemberAIMessage,
} from "@/lib/memberAi";

export const Route = createFileRoute("/_authenticated/ai-helper")({ component: Page });

function Page() {
  return (
    <AIHelperAccessGuard>
      <HelperInner />
    </AIHelperAccessGuard>
  );
}

function HelperInner() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AIHelperSettings | null>(null);
  const [conversations, setConversations] = useState<MemberAIConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MemberAIMessage[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => { getHelperSettings().then(setSettings); }, []);
  useEffect(() => { if (user) listMemberConversations(user.id).then(setConversations); }, [user]);
  useEffect(() => { if (activeId) listMemberMessages(activeId).then(setMessages); else setMessages([]); }, [activeId]);

  if (!user || !settings) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;

  const onNew = async () => {
    const c = await createMemberConversation(user.id);
    setConversations([c, ...conversations]);
    setActiveId(c.id);
  };
  const onDelete = async (id: string) => {
    await deleteMemberConversation(id);
    setConversations(conversations.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  };
  const onSubmit = async (text: string) => {
    let convId = activeId;
    if (!convId) {
      const c = await createMemberConversation(user.id, text.slice(0, 40));
      setConversations([c, ...conversations]);
      setActiveId(c.id);
      convId = c.id;
    }
    setSending(true);
    try {
      const userMsg = await addMemberMessage(convId, "user", text);
      setMessages((m) => [...m, userMsg]);
      const { answer, related } = await buildMemberAIAnswer(text, settings);
      const aiMsg = await addMemberMessage(convId, "assistant", answer, related);
      setMessages((m) => [...m, aiMsg]);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send");
    } finally { setSending(false); }
  };

  return (
    <MemberAIHelperLayout
      sidebar={
        <MemberAIConversationSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={setActiveId}
          onNew={onNew}
          onDelete={onDelete}
        />
      }
    >
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {messages.length === 0 ? (
          <Card className="max-w-xl mx-auto mt-8">
            <CardContent className="py-10 text-center space-y-2">
              <Sparkles className="size-10 mx-auto text-primary" />
              <h1 className="text-xl font-semibold">Ask the {settings.assistant_name}</h1>
              <p className="text-sm text-muted-foreground">Get help finding the right lesson, post, event, or resource. I'm an AI helper, not a human.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((m) => (
              <div key={m.id} className="space-y-1">
                <MemberAIMessageBubble message={m} />
                {m.role === "assistant" && (
                  <div className="flex gap-1 pl-10">
                    <Button variant="ghost" size="sm" onClick={() => toast.success("Thanks for the feedback")}><ThumbsUp className="size-3" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => toast.success("Thanks — we'll improve this")}><ThumbsDown className="size-3" /></Button>
                  </div>
                )}
              </div>
            ))}
            {sending && <div className="text-xs text-muted-foreground pl-10">Thinking…</div>}
          </div>
        )}
      </div>
      <MemberAIPromptInput onSubmit={onSubmit} disabled={sending} />
    </MemberAIHelperLayout>
  );
}

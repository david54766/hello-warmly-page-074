import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MessageSquare } from "lucide-react";
import { listMyConversations, type ConversationSummary } from "@/lib/chat";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageThread } from "@/components/chat/MessageThread";
import { NewConversationModal } from "@/components/chat/NewConversationModal";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ c: z.string().uuid().optional() });

export const Route = createFileRoute("/_authenticated/chat")({
  validateSearch: searchSchema,
  component: ChatPage,
});

function ChatPage() {
  const { user, isAdmin, roles } = useAuth();
  const { c } = Route.useSearch();
  const navigate = useNavigate();
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const isMod = isAdmin || roles.includes("moderator");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setItems(await listMyConversations(user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Realtime list refresh on new messages / membership changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`chat-list:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversation_members", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

  const select = (id: string) => navigate({ to: "/chat", search: { c: id } });
  const back = () => navigate({ to: "/chat", search: {} });
  const active = c ? items.find((s) => s.conversation.id === c) : null;

  if (!user) return null;

  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8">
      <div className="h-[calc(100dvh-4rem-3.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] md:h-[calc(100dvh-4rem-env(safe-area-inset-top))] flex bg-background border-t border-border">
        {/* Conversation list */}
        <aside className={cn(
          "w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-card/40",
          c && "hidden md:flex",
        )}>
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h1 className="text-xl font-semibold tracking-tight">Messages</h1>
              <Button size="sm" onClick={() => setOpenNew(true)}>
                <Plus className="size-4 mr-1" />New
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Connect with members, groups, and Spaces in real time.
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" />
              </div>
            ) : (
              <ConversationList items={items} activeId={c ?? null} onSelect={select} />
            )}
          </div>
        </aside>

        {/* Active conversation */}
        <section className={cn("flex-1 min-w-0 flex flex-col", !c && "hidden md:flex")}>
          {active ? (
            <>
              <ChatHeader summary={active} onBack={back} />
              <div className="flex-1 min-h-0">
                <MessageThread conversationId={active.conversation.id} currentUserId={user.id} isMod={isMod} />
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-center p-8">
              <div className="max-w-sm space-y-3">
                <div className="mx-auto size-14 rounded-2xl bg-primary/10 text-primary grid place-items-center">
                  <MessageSquare className="size-7" />
                </div>
                <h2 className="text-lg font-semibold">No conversation selected</h2>
                <p className="text-sm text-muted-foreground">
                  Pick a conversation from the list, or start a new one to begin chatting.
                </p>
                <Button onClick={() => setOpenNew(true)}><Plus className="size-4 mr-1" />New message</Button>
              </div>
            </div>
          )}
        </section>
      </div>

      <NewConversationModal
        open={openNew}
        onOpenChange={setOpenNew}
        currentUserId={user.id}
        onCreated={(id) => { setOpenNew(false); load(); navigate({ to: "/chat", search: { c: id } }); }}
      />
    </div>
  );
}
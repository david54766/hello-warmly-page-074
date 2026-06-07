import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchMessages,
  fetchReactions,
  markRead,
  type Message,
  type MessageReaction,
  type ProfileLite,
} from "@/lib/chat";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { ReportMessageModal } from "./ReportMessageModal";
import { Skeleton } from "@/components/ui/skeleton";

export function MessageThread({
  conversationId,
  currentUserId,
  isMod,
}: {
  conversationId: string;
  currentUserId: string;
  isMod: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileLite>>(new Map());
  const [loading, setLoading] = useState(true);
  const [reportId, setReportId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadProfiles = useCallback(async (msgs: Message[]) => {
    const ids = Array.from(new Set(msgs.map((m) => m.sender_id))).filter((id) => !profiles.has(id));
    if (!ids.length) return;
    const { data } = await supabase.from("profiles").select("id,full_name,email,avatar_url").in("id", ids);
    setProfiles((prev) => {
      const next = new Map(prev);
      (data ?? []).forEach((p: any) => next.set(p.id, p));
      return next;
    });
  }, [profiles]);

  const load = useCallback(async () => {
    setLoading(true);
    const msgs = await fetchMessages(conversationId);
    setMessages(msgs);
    const rxs = await fetchReactions(msgs.map((m) => m.id));
    setReactions(rxs);
    await loadProfiles(msgs);
    await markRead(conversationId, currentUserId).catch(() => {});
    setLoading(false);
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }));
  }, [conversationId, currentUserId, loadProfiles]);

  useEffect(() => { load(); }, [load]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        async () => {
          const msgs = await fetchMessages(conversationId);
          setMessages(msgs);
          await loadProfiles(msgs);
          await markRead(conversationId, currentUserId).catch(() => {});
          requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        async () => {
          const ids = messages.map((m) => m.id);
          if (ids.length) setReactions(await fetchReactions(ids));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, currentUserId, loadProfiles, messages]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-12 w-1/2 ml-auto" />
            <Skeleton className="h-16 w-3/4" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">
            No messages yet. Say hello 👋
          </p>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              sender={profiles.get(m.sender_id)}
              isMe={m.sender_id === currentUserId}
              isMod={isMod}
              currentUserId={currentUserId}
              reactions={reactions.filter((r) => r.message_id === m.id)}
              onChanged={load}
              onReport={(id) => setReportId(id)}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <MessageComposer conversationId={conversationId} senderId={currentUserId} onSent={load} />
      <ReportMessageModal
        messageId={reportId}
        reporterId={currentUserId}
        onClose={() => setReportId(null)}
      />
    </div>
  );
}
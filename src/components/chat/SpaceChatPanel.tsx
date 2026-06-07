import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getOrCreateSpaceConversation } from "@/lib/chat";
import { MessageThread } from "./MessageThread";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/DashboardCard";
import { MessageSquare, Lock } from "lucide-react";

export function SpaceChatPanel({
  spaceId,
  enabled,
  isMember,
}: {
  spaceId: string;
  enabled: boolean;
  isMember: boolean;
}) {
  const { user, isAdmin, roles } = useAuth();
  const [convId, setConvId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isMod = isAdmin || roles.includes("moderator");

  useEffect(() => {
    if (!enabled || !isMember || !user) { setLoading(false); return; }
    (async () => {
      try {
        const id = await getOrCreateSpaceConversation(spaceId, user.id);
        setConvId(id);
      } finally { setLoading(false); }
    })();
  }, [spaceId, enabled, isMember, user]);

  if (!enabled) {
    return <EmptyState icon={<Lock className="size-5" />} title="Chat is disabled" description="An admin can enable chat for this Space in settings." />;
  }
  if (!isMember) {
    return <EmptyState icon={<MessageSquare className="size-5" />} title="Join to chat" description="Become a member of this Space to join the conversation." />;
  }
  if (loading || !convId || !user) return <Skeleton className="h-[60vh] rounded-2xl" />;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden h-[70vh] flex flex-col">
      <MessageThread conversationId={convId} currentUserId={user.id} isMod={isMod} />
    </div>
  );
}
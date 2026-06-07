import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Hash, Users } from "lucide-react";
import { conversationDisplayName, initials, type ConversationSummary } from "@/lib/chat";

export function ChatHeader({
  summary,
  onBack,
}: {
  summary: ConversationSummary;
  onBack?: () => void;
}) {
  const name = conversationDisplayName(summary);
  const type = summary.conversation.type;
  const subtitle =
    type === "space" ? "Space chat" :
    type === "group" ? `${summary.members.length + 1} members` :
    summary.members[0]?.email ?? "Direct message";
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-background">
      {onBack && (
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowLeft className="size-4" />
        </Button>
      )}
      {type === "space" ? (
        <div className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center"><Hash className="size-4" /></div>
      ) : type === "group" ? (
        <div className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center"><Users className="size-4" /></div>
      ) : summary.members[0] ? (
        <Avatar className="size-9">
          <AvatarImage src={summary.members[0].avatar_url || undefined} />
          <AvatarFallback>{initials(summary.members[0].full_name, summary.members[0].email)}</AvatarFallback>
        </Avatar>
      ) : null}
      <div className="min-w-0">
        <p className="font-semibold truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
    </div>
  );
}
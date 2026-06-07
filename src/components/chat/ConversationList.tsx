import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hash, Users, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { conversationDisplayName, initials, timeShort, type ConversationSummary } from "@/lib/chat";

export function ConversationList({
  items,
  activeId,
  onSelect,
}: {
  items: ConversationSummary[];
  activeId?: string | null;
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        No conversations yet. Start one from the New message button.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {items.map((s) => {
        const name = conversationDisplayName(s);
        const type = s.conversation.type;
        const isActive = s.conversation.id === activeId;
        const unread = s.unreadCount;
        const preview = s.lastMessage?.body
          ? (s.lastMessage.status === "deleted" ? "Message deleted"
            : s.lastMessage.status === "hidden" ? "Hidden by moderator"
            : s.lastMessage.body)
          : "No messages yet";
        return (
          <li key={s.conversation.id}>
            <button
              onClick={() => onSelect(s.conversation.id)}
              className={cn(
                "w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors",
                isActive && "bg-accent",
              )}
            >
              {type === "space" ? (
                <div className="size-10 rounded-full bg-primary/10 text-primary grid place-items-center"><Hash className="size-5" /></div>
              ) : type === "group" ? (
                <div className="size-10 rounded-full bg-primary/10 text-primary grid place-items-center"><Users className="size-5" /></div>
              ) : s.members[0] ? (
                <Avatar className="size-10">
                  <AvatarImage src={s.members[0].avatar_url || undefined} />
                  <AvatarFallback>{initials(s.members[0].full_name, s.members[0].email)}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="size-10 rounded-full bg-muted grid place-items-center"><MessageSquare className="size-5" /></div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("text-sm truncate", unread > 0 ? "font-semibold" : "font-medium")}>{name}</p>
                  {s.lastMessage && (
                    <span className="text-[11px] text-muted-foreground shrink-0">{timeShort(s.lastMessage.created_at)}</span>
                  )}
                </div>
                <p className={cn("text-xs truncate", unread > 0 ? "text-foreground" : "text-muted-foreground")}>{preview}</p>
              </div>
              {unread > 0 && (
                <span className="ml-2 shrink-0 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-medium min-w-5 h-5 px-1.5">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
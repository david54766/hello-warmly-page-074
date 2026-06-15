import { cn } from "@/lib/utils";
import { Sparkles, User } from "lucide-react";
import { RelatedContentList } from "./RelatedContentList";
import type { MemberAIMessage } from "@/lib/memberAi";

export function MemberAIMessageBubble({ message }: { message: MemberAIMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="size-7 rounded-full bg-primary/10 grid place-items-center shrink-0">
          <Sparkles className="size-3.5 text-primary" />
        </div>
      )}
      <div className={cn("max-w-[80%] space-y-2", isUser && "items-end")}>
        <div className={cn("rounded-lg px-3 py-2 text-sm", isUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {!isUser && message.related_sources_json?.length > 0 && (
          <RelatedContentList items={message.related_sources_json} />
        )}
      </div>
      {isUser && (
        <div className="size-7 rounded-full bg-muted grid place-items-center shrink-0">
          <User className="size-3.5" />
        </div>
      )}
    </div>
  );
}

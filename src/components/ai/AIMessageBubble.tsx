import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIMessage } from "@/lib/ai";

export function AIMessageBubble({ message }: { message: AIMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3 mb-4", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn("size-8 rounded-full grid place-items-center shrink-0", isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>
      <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap", isUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
        {message.content}
      </div>
    </div>
  );
}
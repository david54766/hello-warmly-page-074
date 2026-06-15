import { Button } from "@/components/ui/button";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemberAIConversation } from "@/lib/memberAi";

export function MemberAIConversationSidebar({
  conversations, activeId, onSelect, onNew, onDelete,
}: {
  conversations: MemberAIConversation[]; activeId: string | null;
  onSelect: (id: string) => void; onNew: () => void; onDelete: (id: string) => void;
}) {
  return (
    <div className="p-2 space-y-1">
      <Button onClick={onNew} className="w-full" size="sm"><Plus className="size-3 mr-1" />New conversation</Button>
      <div className="mt-3 space-y-1">
        {conversations.length === 0 && <div className="text-xs text-muted-foreground p-2">No conversations yet.</div>}
        {conversations.map((c) => (
          <div
            key={c.id}
            className={cn("group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted cursor-pointer", c.id === activeId && "bg-muted")}
            onClick={() => onSelect(c.id)}
          >
            <MessageSquare className="size-3 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">{c.title}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

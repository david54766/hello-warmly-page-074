import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIConversation } from "@/lib/ai";

export function AIConversationSidebar({ conversations, activeId, onSelect, onNew, onDelete }: { conversations: AIConversation[]; activeId: string | null; onSelect: (id: string) => void; onNew: () => void; onDelete: (id: string) => void }) {
  return (
    <aside className="w-full border rounded-2xl bg-card flex flex-col max-h-[70vh]">
      <div className="p-3 border-b">
        <Button className="w-full" size="sm" onClick={onNew}><Plus className="size-4 mr-1.5" />New conversation</Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 && <p className="text-xs text-muted-foreground p-3">No conversations yet.</p>}
        {conversations.map((c) => (
          <div key={c.id} className={cn("group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm cursor-pointer", activeId === c.id ? "bg-primary/10 text-primary" : "hover:bg-accent")}
               onClick={() => onSelect(c.id)}>
            <MessageSquare className="size-3.5 shrink-0" />
            <span className="flex-1 truncate">{c.title}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
              aria-label="Delete conversation"
            ><Trash2 className="size-3.5" /></button>
          </div>
        ))}
      </div>
    </aside>
  );
}
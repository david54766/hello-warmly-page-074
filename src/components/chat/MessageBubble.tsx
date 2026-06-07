import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile, MoreHorizontal, Trash2, Flag, EyeOff, RotateCcw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  initials,
  REACTION_EMOJI,
  softDeleteMessage,
  hideMessage,
  restoreMessage,
  toggleReaction,
  type Message,
  type MessageReaction,
  type MessageReactionType,
  type ProfileLite,
} from "@/lib/chat";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const REACTIONS: MessageReactionType[] = ["like", "love", "celebrate", "helpful"];

export function MessageBubble({
  message,
  sender,
  isMe,
  isMod,
  currentUserId,
  reactions,
  onChanged,
  onReport,
}: {
  message: Message;
  sender?: ProfileLite | null;
  isMe: boolean;
  isMod: boolean;
  currentUserId: string;
  reactions: MessageReaction[];
  onChanged: () => void;
  onReport: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const isDeleted = message.status === "deleted";
  const isHidden = message.status === "hidden";

  const grouped = REACTIONS.map((t) => ({
    type: t,
    count: reactions.filter((r) => r.reaction_type === t).length,
  })).filter((g) => g.count > 0);

  const handleReact = async (t: MessageReactionType) => {
    try {
      await toggleReaction(message.id, currentUserId, t);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to react");
    }
    setOpen(false);
    onChanged();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this message?")) return;
    try { await softDeleteMessage(message.id); onChanged(); } catch (e: any) { toast.error(e.message); }
  };
  const handleHide = async () => { try { await hideMessage(message.id); toast.success("Message hidden"); onChanged(); } catch (e: any) { toast.error(e.message); } };
  const handleRestore = async () => { try { await restoreMessage(message.id); toast.success("Restored"); onChanged(); } catch (e: any) { toast.error(e.message); } };

  return (
    <div className={cn("flex gap-2 group", isMe && "flex-row-reverse")}>
      <Avatar className="size-8 mt-0.5 shrink-0">
        <AvatarImage src={sender?.avatar_url || undefined} />
        <AvatarFallback>{initials(sender?.full_name, sender?.email)}</AvatarFallback>
      </Avatar>
      <div className={cn("max-w-[78%]", isMe && "items-end flex flex-col")}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5 px-1">
          <span className="font-medium text-foreground">{sender?.full_name || sender?.email || "Member"}</span>
          <span>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words",
            isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm",
            (isDeleted || isHidden) && "italic opacity-70",
          )}
        >
          {isDeleted ? "Message deleted" : isHidden ? "Hidden by moderator" : message.body}
        </div>
        {grouped.length > 0 && (
          <div className={cn("flex gap-1 mt-1 px-1", isMe && "justify-end")}>
            {grouped.map((g) => (
              <span key={g.type} className="text-xs rounded-full bg-muted px-2 py-0.5">
                {REACTION_EMOJI[g.type]} {g.count}
              </span>
            ))}
          </div>
        )}
      </div>
      {!isDeleted && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity self-center">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7"><Smile className="size-4" /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1 flex gap-1">
              {REACTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => handleReact(t)}
                  className="text-lg hover:scale-125 transition-transform px-1"
                >
                  {REACTION_EMOJI[t]}
                </button>
              ))}
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7"><MoreHorizontal className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isMe ? "end" : "start"}>
              {isMe && <DropdownMenuItem onClick={handleDelete}><Trash2 className="size-4 mr-2" />Delete</DropdownMenuItem>}
              {!isMe && <DropdownMenuItem onClick={() => onReport(message.id)}><Flag className="size-4 mr-2" />Report</DropdownMenuItem>}
              {isMod && message.status === "active" && (
                <DropdownMenuItem onClick={handleHide}><EyeOff className="size-4 mr-2" />Hide (mod)</DropdownMenuItem>
              )}
              {isMod && message.status === "hidden" && (
                <DropdownMenuItem onClick={handleRestore}><RotateCcw className="size-4 mr-2" />Restore (mod)</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
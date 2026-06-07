import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { sendMessage } from "@/lib/chat";
import { toast } from "sonner";

export function MessageComposer({
  conversationId,
  senderId,
  onSent,
}: {
  conversationId: string;
  senderId: string;
  onSent?: () => void;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setBody(""); }, [conversationId]);

  const send = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    try {
      await sendMessage(conversationId, senderId, body);
      setBody("");
      onSent?.();
      ref.current?.focus();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to send");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); send(); }}
      className="flex gap-2 items-end border-t border-border p-3 bg-background"
    >
      <Textarea
        ref={ref}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        placeholder="Write a message…"
        rows={1}
        className="resize-none min-h-[40px] max-h-32"
      />
      <Button type="submit" disabled={busy || !body.trim()} size="icon" className="shrink-0">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      </Button>
    </form>
  );
}
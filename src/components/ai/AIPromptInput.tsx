import { useState, type KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export function AIPromptInput({ disabled, onSend }: { disabled?: boolean; onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  };
  return (
    <div className="border-t bg-background p-3 flex items-end gap-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        placeholder="Ask the assistant or describe what you want to create..."
        className="min-h-[60px] resize-none"
        disabled={disabled}
      />
      <Button onClick={submit} disabled={disabled || !text.trim()}><Send className="size-4" /></Button>
    </div>
  );
}
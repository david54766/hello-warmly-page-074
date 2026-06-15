import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export function MemberAIPromptInput({ onSubmit, disabled }: { onSubmit: (text: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const submit = () => {
    const t = value.trim();
    if (!t) return;
    onSubmit(t);
    setValue("");
    setTimeout(() => ref.current?.focus(), 50);
  };
  return (
    <div className="border-t p-3 flex gap-2 items-end">
      <Textarea
        ref={ref}
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder="Ask a question about courses, posts, events…"
        disabled={disabled}
        className="resize-none"
      />
      <Button onClick={submit} disabled={disabled || !value.trim()} size="icon"><Send className="size-4" /></Button>
    </div>
  );
}

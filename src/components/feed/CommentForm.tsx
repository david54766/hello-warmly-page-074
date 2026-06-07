import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

export function CommentForm({
  postId,
  parentId,
  onPosted,
  onCancel,
  autoFocus,
  compact,
}: {
  postId: string;
  parentId?: string;
  onPosted: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return;
    const trimmed = body.trim();
    if (!trimmed) return toast.error("Write a comment first.");
    if (trimmed.length > 2000) return toast.error("Comment is too long (max 2000 characters).");
    setBusy(true);
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      author_id: user.id,
      body: trimmed,
      parent_comment_id: parentId ?? null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setBody("");
    onPosted();
  };

  return (
    <div className="space-y-2">
      <Textarea
        autoFocus={autoFocus}
        rows={compact ? 2 : 3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        placeholder={parentId ? "Write a reply…" : "Write a comment…"}
      />
      <div className="flex justify-end gap-2">
        {onCancel && <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>}
        <Button size="sm" onClick={submit} disabled={busy}>
          {busy ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Send className="size-3.5 mr-1.5" />}
          {parentId ? "Reply" : "Comment"}
        </Button>
      </div>
    </div>
  );
}
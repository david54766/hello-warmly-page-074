import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import type { Space } from "@/lib/spaces";
import type { PostType, PostVisibility } from "@/lib/feed";

export function PostComposer({
  spaces,
  defaultSpaceId,
  onPosted,
}: {
  spaces: Space[];
  defaultSpaceId?: string;
  onPosted?: () => void;
}) {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [postType, setPostType] = useState<PostType | "poll_placeholder">("quick_post");
  const [spaceId, setSpaceId] = useState<string>(defaultSpaceId ?? spaces[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("space_members");
  const [busy, setBusy] = useState(false);

  const isPoll = postType === "poll_placeholder";
  const needsTitle = postType === "article" || postType === "question_placeholder";

  const reset = () => {
    setTitle(""); setBody(""); setPostType("quick_post");
    setVisibility("space_members"); setOpen(false);
  };

  const submit = async () => {
    if (!user) return;
    if (isPoll) return toast.error("Polls are coming soon.");
    if (!spaceId) return toast.error("Choose a Space to post in.");
    if (needsTitle && !title.trim()) return toast.error("Title is required for this post type.");
    if (!body.trim() && !needsTitle) return toast.error("Write something before posting.");
    if (!body.trim() && !title.trim()) return toast.error("Add a title or body.");

    setBusy(true);
    const { error } = await supabase.from("posts").insert({
      space_id: spaceId,
      author_id: user.id,
      post_type: postType,
      title: needsTitle ? title.trim().slice(0, 200) : (title.trim() ? title.trim().slice(0, 200) : null),
      body: body.trim().slice(0, 10000),
      visibility,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Post published");
    reset();
    onPosted?.();
  };

  if (spaces.length === 0 && !defaultSpaceId) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="pt-5 text-sm text-muted-foreground">
          Join a Space to start posting.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="pt-5 space-y-3">
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full text-left rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground hover:bg-accent transition-colors"
          >
            Share an update, ask a question, or start a discussion…
          </button>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Post type</Label>
                <Select value={postType} onValueChange={(v) => setPostType(v as typeof postType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick_post">Quick post</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="question_placeholder">Question</SelectItem>
                    <SelectItem value="event_announcement_placeholder">Event announcement</SelectItem>
                    <SelectItem value="poll_placeholder">Poll (coming soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!defaultSpaceId && (
                <div className="space-y-1.5">
                  <Label>Space</Label>
                  <Select value={spaceId} onValueChange={setSpaceId}>
                    <SelectTrigger><SelectValue placeholder="Choose a Space" /></SelectTrigger>
                    <SelectContent>
                      {spaces.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {(needsTitle || postType === "event_announcement_placeholder") && (
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={needsTitle ? "Required" : "Optional"} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Body</Label>
              <Textarea
                rows={5}
                maxLength={10000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={isPoll ? "Polls are coming soon." : "What's on your mind?"}
                disabled={isPoll}
              />
            </div>
            {isAdmin && (
              <div className="space-y-1.5">
                <Label>Visibility</Label>
                <Select value={visibility} onValueChange={(v) => setVisibility(v as PostVisibility)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="space_members">Space members</SelectItem>
                    <SelectItem value="admins_only">Admins only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={reset} disabled={busy}>Cancel</Button>
              <Button onClick={submit} disabled={busy || isPoll}>
                {busy ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Send className="size-4 mr-1.5" />}
                Publish
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
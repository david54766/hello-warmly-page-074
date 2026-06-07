import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Send, Loader2, Plus, X } from "lucide-react";
import type { Space } from "@/lib/spaces";
import { parseHashtags, normalizeHashtag, type PostType, type PostVisibility } from "@/lib/feed";

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
  const [postType, setPostType] = useState<PostType>("quick_post");
  const [spaceId, setSpaceId] = useState<string>(defaultSpaceId ?? spaces[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("space_members");
  const [busy, setBusy] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [closesAt, setClosesAt] = useState("");
  const [hashtagsRaw, setHashtagsRaw] = useState("");

  const isPoll = postType === "poll";
  const needsTitle = postType === "article" || postType === "question" || postType === "poll";

  const reset = () => {
    setTitle(""); setBody(""); setPostType("quick_post");
    setVisibility("space_members"); setOpen(false);
    setPollOptions(["", ""]); setAllowMultiple(false); setClosesAt("");
    setHashtagsRaw("");
  };

  const submit = async () => {
    if (!user) return;
    if (!spaceId) return toast.error("Choose a Space to post in.");
    if (needsTitle && !title.trim()) return toast.error("Title is required for this post type.");
    if (isPoll) {
      const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) return toast.error("Add at least two poll options.");
    } else if (!body.trim() && !title.trim()) {
      return toast.error("Add a title or body.");
    }

    setBusy(true);
    const sb = supabase as any;
    const { data: postRow, error } = await sb.from("posts").insert({
      space_id: spaceId,
      author_id: user.id,
      post_type: postType,
      title: needsTitle ? title.trim().slice(0, 200) : (title.trim() ? title.trim().slice(0, 200) : null),
      body: body.trim().slice(0, 10000),
      visibility,
    }).select("id").maybeSingle();
    if (error || !postRow) {
      setBusy(false);
      return toast.error(error?.message ?? "Could not publish post");
    }

    // Poll create
    if (isPoll) {
      const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
      const { data: poll } = await sb.from("polls").insert({
        post_id: postRow.id,
        question: title.trim().slice(0, 300),
        allow_multiple: allowMultiple,
        closes_at: closesAt ? new Date(closesAt).toISOString() : null,
      }).select("id").maybeSingle();
      if (poll) {
        await sb.from("poll_options").insert(
          opts.map((option_text, i) => ({ poll_id: poll.id, option_text: option_text.slice(0, 200), sort_order: i }))
        );
      }
    }

    // Hashtags: from body + explicit field
    const explicit = hashtagsRaw.split(/[\s,]+/).map((s) => normalizeHashtag(s)).filter((x): x is string => !!x);
    const fromBody = parseHashtags(`${title} ${body}`);
    const tags = Array.from(new Set([...explicit, ...fromBody])).slice(0, 10);
    for (const name of tags) {
      const { data: existing } = await sb.from("hashtags").select("id").eq("name", name).maybeSingle();
      let hashtagId = existing?.id as string | undefined;
      if (!hashtagId) {
        const { data: created } = await sb.from("hashtags").insert({ name }).select("id").maybeSingle();
        hashtagId = created?.id;
      }
      if (hashtagId) {
        await sb.from("post_hashtags").insert({ post_id: postRow.id, hashtag_id: hashtagId });
      }
    }

    setBusy(false);
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
                <Select value={postType} onValueChange={(v) => setPostType(v as PostType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick_post">Quick post</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                    <SelectItem value="poll">Poll</SelectItem>
                    <SelectItem value="event_announcement">Event announcement</SelectItem>
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
            {(needsTitle || postType === "event_announcement") && (
              <div className="space-y-1.5">
                <Label>{isPoll ? "Poll question" : "Title"}</Label>
                <Input maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={needsTitle ? "Required" : "Optional"} />
              </div>
            )}
            {!isPoll && (
              <div className="space-y-1.5">
                <Label>Body</Label>
                <Textarea
                  rows={5}
                  maxLength={10000}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="What's on your mind? Use #hashtags to tag topics."
                />
              </div>
            )}
            {isPoll && (
              <div className="space-y-2 rounded-xl border border-border p-3">
                <Label>Poll options</Label>
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      maxLength={200}
                      value={opt}
                      onChange={(e) => setPollOptions((prev) => prev.map((p, idx) => (idx === i ? e.target.value : p)))}
                      placeholder={`Option ${i + 1}`}
                    />
                    {pollOptions.length > 2 && (
                      <Button variant="ghost" size="icon" onClick={() => setPollOptions((prev) => prev.filter((_, idx) => idx !== i))}>
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 8 && (
                  <Button variant="outline" size="sm" onClick={() => setPollOptions((p) => [...p, ""])}>
                    <Plus className="size-4 mr-1" />Add option
                  </Button>
                )}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <Switch checked={allowMultiple} onCheckedChange={setAllowMultiple} id="multi" />
                    <Label htmlFor="multi" className="text-sm">Allow multiple answers</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Closes</Label>
                    <Input type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} className="w-[200px]" />
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hashtags (optional)</Label>
              <Input
                maxLength={200}
                value={hashtagsRaw}
                onChange={(e) => setHashtagsRaw(e.target.value)}
                placeholder="welcome, introductions, feedback"
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
              <Button onClick={submit} disabled={busy}>
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
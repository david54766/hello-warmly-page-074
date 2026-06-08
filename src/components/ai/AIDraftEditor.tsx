import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { AIGeneratedContent } from "@/lib/ai";

export function AIDraftEditor({ draft, saving, onSave, onPublish }: { draft: AIGeneratedContent; saving: boolean; onSave: (patch: Partial<AIGeneratedContent>) => void; onPublish: () => void }) {
  const [title, setTitle] = useState(draft.title);
  const [body, setBody] = useState(draft.body);
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Body</Label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[260px]" />
      </div>
      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" disabled={saving} onClick={() => onSave({ title, body })}>{saving ? "Saving..." : "Save changes"}</Button>
        {draft.status === "draft" && <Button onClick={onPublish}>Publish as post...</Button>}
      </div>
    </div>
  );
}
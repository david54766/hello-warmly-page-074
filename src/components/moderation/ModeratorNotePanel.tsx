import { useEffect, useState } from "react";
import { addNote, listNotes, type ModeratorNote } from "@/lib/moderation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { NotebookPen } from "lucide-react";

export function ModeratorNotePanel({ userId }: { userId: string }) {
  const [notes, setNotes] = useState<ModeratorNote[] | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => listNotes(userId).then(setNotes).catch(() => setNotes([]));
  useEffect(() => { load(); }, [userId]);

  const save = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try { await addNote(userId, draft.trim()); setDraft(""); toast.success("Note added"); load(); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium"><NotebookPen className="size-4" /> Moderator notes</div>
      <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Document a concern, decision, or context…" rows={3} />
      <div className="flex justify-end"><Button size="sm" onClick={save} disabled={saving || !draft.trim()}>Add note</Button></div>
      {!notes ? <Skeleton className="h-16 rounded-lg" /> : notes.length === 0 ? (
        <p className="text-xs text-muted-foreground">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg border p-3 text-sm">
              <p className="whitespace-pre-wrap">{n.note}</p>
              <p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface SpaceLite { id: string; name: string }

export function PublishDraftModal({ open, defaultTitle, defaultBody, onClose, onConfirm }: { open: boolean; defaultTitle: string; defaultBody: string; onClose: () => void; onConfirm: (spaceId: string, title: string, body: string) => Promise<void> }) {
  const [spaces, setSpaces] = useState<SpaceLite[]>([]);
  const [spaceId, setSpaceId] = useState<string>("");
  const [title, setTitle] = useState(defaultTitle);
  const [body, setBody] = useState(defaultBody);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setTitle(defaultTitle); setBody(defaultBody); }, [defaultTitle, defaultBody]);
  useEffect(() => {
    if (!open) return;
    supabase.from("spaces").select("id,name").eq("is_archived", false).order("name").then(({ data }) => {
      const rows = (data ?? []) as SpaceLite[];
      setSpaces(rows);
      if (!spaceId && rows[0]) setSpaceId(rows[0].id);
    });
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Publish draft as post</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Target Space</Label>
            <Select value={spaceId} onValueChange={setSpaceId}>
              <SelectTrigger><SelectValue placeholder="Pick a Space" /></SelectTrigger>
              <SelectContent>{spaces.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[180px]" />
          </div>
          <p className="text-xs text-muted-foreground">Review carefully — AI content must be reviewed before publishing.</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!spaceId || busy} onClick={async () => { setBusy(true); try { await onConfirm(spaceId, title, body); } finally { setBusy(false); } }}>{busy ? "Publishing..." : "Confirm publish"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
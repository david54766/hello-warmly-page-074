import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { archiveAnnouncement, sendAnnouncement, setPinned, type AdminAnnouncement } from "@/lib/announcements";
import { AnnouncementStatusPill } from "./AnnouncementStatusPill";
import { toast } from "sonner";
import { Pin, PinOff, Send, Archive } from "lucide-react";
import { useState } from "react";

export function AnnouncementTable({ rows, onChange }: { rows: AdminAnnouncement[]; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);

  if (!rows.length) return <p className="text-sm text-muted-foreground">No announcements yet.</p>;

  const handleSend = async (id: string) => {
    if (!confirm("Send this announcement now? Targeted members will be notified.")) return;
    setBusy(id);
    try { const n = await sendAnnouncement(id); toast.success(`Sent — ${n} members notified`); onChange(); }
    catch (e: any) { toast.error(e?.message ?? "Send failed"); }
    finally { setBusy(null); }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Target</TableHead>
          <TableHead>Display</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((a) => (
          <TableRow key={a.id}>
            <TableCell>
              <Link to="/admin/announcements/$announcementId" params={{ announcementId: a.id }} className="font-medium hover:underline">{a.title}</Link>
              {a.pinned && <span className="ml-2 text-xs text-amber-600">📌 pinned</span>}
            </TableCell>
            <TableCell className="text-muted-foreground capitalize">{a.target_type.replace("_", " ")}</TableCell>
            <TableCell className="text-muted-foreground capitalize">{a.display_type.replace("_", " ")}</TableCell>
            <TableCell><AnnouncementStatusPill status={a.status} /></TableCell>
            <TableCell className="text-right">
              <div className="inline-flex gap-1">
                {a.status !== "sent" && a.status !== "archived" && (
                  <Button size="sm" variant="outline" disabled={busy === a.id} onClick={() => handleSend(a.id)}><Send className="size-3.5 mr-1" />Send</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setPinned(a.id, !a.pinned).then(onChange)}>
                  {a.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/admin/announcements/$announcementId/edit" params={{ announcementId: a.id }}>Edit</Link>
                </Button>
                {a.status !== "archived" && (
                  <Button size="sm" variant="ghost" onClick={() => archiveAnnouncement(a.id).then(onChange)}><Archive className="size-3.5" /></Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
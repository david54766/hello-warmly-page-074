import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sbEvents, type RsvpStatus } from "@/lib/events";
import type { Attendee } from "./AttendeeList";
import { Trash2 } from "lucide-react";

export function AdminRSVPTable({ eventId, attendees, onChange }: { eventId: string; attendees: Attendee[]; onChange: () => void }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [newUserId, setNewUserId] = useState("");

  const filtered = attendees.filter((a) => {
    if (filter !== "all" && a.rsvp.status !== filter) return false;
    if (q && !(a.profile?.full_name ?? "").toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const setStatus = async (userId: string, status: RsvpStatus) => {
    const { error } = await sbEvents.from("event_rsvps").upsert(
      { event_id: eventId, user_id: userId, status },
      { onConflict: "event_id,user_id" }
    );
    if (error) return toast.error(error.message);
    toast.success("RSVP updated");
    onChange();
  };

  const remove = async (userId: string) => {
    const { error } = await sbEvents.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", userId);
    if (error) return toast.error(error.message);
    toast.success("RSVP removed");
    onChange();
  };

  const addManual = async () => {
    if (!newUserId.trim()) return;
    await setStatus(newUserId.trim(), "going");
    setNewUserId("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search attendees…" className="flex-1 min-w-[200px]" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="going">Going</SelectItem>
            <SelectItem value="waitlist">Waitlist</SelectItem>
            <SelectItem value="not_going">Not going</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 items-center text-sm">
        <Input value={newUserId} onChange={(e) => setNewUserId(e.target.value)} placeholder="User ID to add manually…" />
        <Button variant="outline" onClick={addManual}>Add</Button>
      </div>
      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No RSVPs match.</TableCell></TableRow>
            ) : filtered.map((a) => (
              <TableRow key={a.rsvp.id}>
                <TableCell>{a.profile?.full_name ?? a.rsvp.user_id}</TableCell>
                <TableCell>
                  <Select value={a.rsvp.status} onValueChange={(v) => setStatus(a.rsvp.user_id, v as RsvpStatus)}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="going">Going</SelectItem>
                      <SelectItem value="waitlist">Waitlist</SelectItem>
                      <SelectItem value="not_going">Not going</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => remove(a.rsvp.user_id)}><Trash2 className="size-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
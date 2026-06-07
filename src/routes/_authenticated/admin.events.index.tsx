import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sbEvents, fetchEvents, formatEventDate, EVENT_TYPE_LABELS, EVENT_STATUS_LABELS, type EventRow, type EventStatus, type EventType } from "@/lib/events";
import type { Space } from "@/lib/spaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { StatusPill, EmptyState } from "@/components/app/DashboardCard";
import { AdminEventForm } from "@/components/events/AdminEventForm";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/events/")({
  component: AdminEventsPage,
});

function AdminEventsPage() {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [spaceFilter, setSpaceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [open, setOpen] = useState(false);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [isAdmin, loading, navigate]);

  const load = async () => {
    const [list, { data: sp }, { data: rsvps }] = await Promise.all([
      fetchEvents(),
      supabase.from("spaces").select("*").eq("is_archived", false).order("sort_order"),
      (supabase as any).from("event_rsvps").select("event_id,status"),
    ]);
    setEvents(list);
    setSpaces((sp ?? []) as Space[]);
    const counts: Record<string, number> = {};
    (rsvps ?? []).forEach((r: { event_id: string; status: string }) => {
      if (r.status === "going") counts[r.event_id] = (counts[r.event_id] ?? 0) + 1;
    });
    setRsvpCounts(counts);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const spaceById = useMemo(() => new Map(spaces.map((s) => [s.id, s])), [spaces]);

  const filtered = events.filter((e) => {
    if (q && !e.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (spaceFilter !== "all" && e.space_id !== spaceFilter) return false;
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (typeFilter !== "all" && e.event_type !== typeFilter) return false;
    return true;
  });

  const remove = async (id: string) => {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    const { error } = await sbEvents.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Event deleted");
    load();
  };

  const cancel = async (id: string) => {
    const { error } = await sbEvents.from("events").update({ status: "canceled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Event canceled");
    load();
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-1">Create, edit, and manage live events.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4" />New event</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create event</DialogTitle></DialogHeader>
            {user && <AdminEventForm spaces={spaces} userId={user.id} onSaved={() => { setOpen(false); load(); }} />}
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex flex-wrap gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="flex-1 min-w-[200px]" />
        <Select value={spaceFilter} onValueChange={setSpaceFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All spaces</SelectItem>
            {spaces.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(EVENT_STATUS_LABELS) as EventStatus[]).map((s) => <SelectItem key={s} value={s}>{EVENT_STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((t) => <SelectItem key={t} value={t}>{EVENT_TYPE_LABELS[t]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No events match" description="Try clearing filters or creating a new event." />
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Space</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>RSVPs</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.title}</TableCell>
                  <TableCell className="text-muted-foreground">{spaceById.get(e.space_id)?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatEventDate(e.start_time, e.timezone)}</TableCell>
                  <TableCell><StatusPill label={EVENT_STATUS_LABELS[e.status]} tone={e.status === "canceled" ? "warn" : e.status === "published" ? "success" : "neutral"} /></TableCell>
                  <TableCell>{rsvpCounts[e.id] ?? 0}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/admin/events/$eventId" params={{ eventId: e.id }}><Pencil className="size-4" />Edit</Link>
                    </Button>
                    {e.status !== "canceled" && <Button variant="ghost" size="sm" onClick={() => cancel(e.id)}>Cancel</Button>}
                    <Button variant="ghost" size="icon" onClick={() => remove(e.id)}><Trash2 className="size-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchEvent, fetchRsvps, type EventRow, type RsvpRow } from "@/lib/events";
import type { Space } from "@/lib/spaces";
import { AdminEventForm } from "@/components/events/AdminEventForm";
import { AdminRSVPTable } from "@/components/events/AdminRSVPTable";
import type { Attendee } from "@/components/events/AttendeeList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/events/$eventId")({
  component: AdminEventDetail,
});

function AdminEventDetail() {
  const { eventId } = useParams({ from: "/_authenticated/admin/events/$eventId" });
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [isAdmin, loading, navigate]);

  const load = async () => {
    const [ev, { data: sp }, rsvps] = await Promise.all([
      fetchEvent(eventId),
      supabase.from("spaces").select("*").eq("is_archived", false).order("sort_order"),
      fetchRsvps(eventId),
    ]);
    setEvent(ev);
    setSpaces((sp ?? []) as Space[]);
    const ids = Array.from(new Set(rsvps.map((r: RsvpRow) => r.user_id)));
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("id,full_name,avatar_url").in("id", ids)
      : { data: [] };
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    setAttendees(rsvps.map((r) => ({ rsvp: r, profile: byId.get(r.user_id) ?? null })));
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, eventId]);

  if (!isAdmin || !event) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild><Link to="/admin/events"><ArrowLeft className="size-4" />Back to events</Link></Button>
        <Button variant="outline" size="sm" asChild><Link to="/events/$eventId" params={{ eventId: event.id }}>View public page</Link></Button>
      </div>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
        <p className="text-sm text-muted-foreground">Edit details and manage RSVPs.</p>
      </header>
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="rsvps">RSVPs ({attendees.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="pt-4">
          {user && <AdminEventForm initial={event} spaces={spaces} userId={user.id} onSaved={(e) => setEvent(e)} />}
        </TabsContent>
        <TabsContent value="rsvps" className="pt-4">
          <AdminRSVPTable eventId={event.id} attendees={attendees} onChange={load} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
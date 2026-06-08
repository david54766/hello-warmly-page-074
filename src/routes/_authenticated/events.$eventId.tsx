import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchEvent, fetchRsvps, formatEventDate,
  EVENT_TYPE_LABELS, VISIBILITY_LABELS, ACCESS_LABELS,
  isLocked, isPast,
  type EventRow, type RsvpRow,
} from "@/lib/events";
import { RSVPButton } from "@/components/events/RSVPButton";
import { AttendeeList, type Attendee } from "@/components/events/AttendeeList";
import { LockedContentCard } from "@/components/courses/LockedContentCard";
import { LockedContentPage } from "@/components/access/LockedContentCard";
import { hasAccess } from "@/lib/access";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/app/DashboardCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Calendar, Clock, ExternalLink, MapPin, Video } from "lucide-react";

export const Route = createFileRoute("/_authenticated/events/$eventId")({
  component: EventDetail,
});

function EventDetail() {
  const { eventId } = useParams({ from: "/_authenticated/events/$eventId" });
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [spaceName, setSpaceName] = useState<string | null>(null);
  const [allowed, setAllowed] = useState<boolean>(true);

  const load = async () => {
    setLoading(true);
    const ev = await fetchEvent(eventId);
    setEvent(ev);
    if (ev) {
      if ((ev.access_level === "paid" || ev.access_level === "paid_placeholder") && user) {
        setAllowed(await hasAccess(user.id, "event", ev.id));
      } else {
        setAllowed(true);
      }
      const [r, { data: sp }] = await Promise.all([
        fetchRsvps(eventId),
        supabase.from("spaces").select("name").eq("id", ev.space_id).maybeSingle(),
      ]);
      setRsvps(r);
      setSpaceName(sp?.name ?? null);
      const ids = Array.from(new Set(r.map((x) => x.user_id)));
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id,full_name,avatar_url").in("id", ids)
        : { data: [] };
      const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
      setAttendees(r.map((rs) => ({ rsvp: rs, profile: byId.get(rs.user_id) ?? null })));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [eventId]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div>;
  if (!event) return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild><Link to="/events"><ArrowLeft className="size-4" />Back to events</Link></Button>
      <p className="text-muted-foreground">Event not found or you don't have access.</p>
    </div>
  );

  const myRsvp = user ? rsvps.find((r) => r.user_id === user.id) ?? null : null;
  const goingCount = rsvps.filter((r) => r.status === "going").length;
  const locked = isLocked(event);
  const past = isPast(event);

  if (locked && !allowed) {
    return (
      <LockedContentPage
        title={`${event.title} is a paid event`}
        message="Upgrade your membership or purchase access to RSVP and join this event."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/events"><ArrowLeft className="size-4" />Back to events</Link></Button>

      {event.status === "canceled" && (
        <Alert variant="destructive">
          <AlertTitle>This event was canceled</AlertTitle>
          <AlertDescription>The host has canceled this event.</AlertDescription>
        </Alert>
      )}

      <Card className="rounded-2xl overflow-hidden">
        {event.cover_image_url ? (
          <div className="aspect-[21/9] bg-muted"><img src={event.cover_image_url} alt="" className="w-full h-full object-cover" /></div>
        ) : (
          <div className="aspect-[21/9] bg-gradient-to-br from-primary/15 to-primary/5 grid place-items-center">
            <Calendar className="size-12 text-primary/60" />
          </div>
        )}
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusPill label={EVENT_TYPE_LABELS[event.event_type]} tone="info" />
            <StatusPill label={VISIBILITY_LABELS[event.visibility]} tone="neutral" />
            <StatusPill label={ACCESS_LABELS[event.access_level]} tone={locked ? "warn" : "neutral"} />
            {past && event.status !== "canceled" && <StatusPill label="Completed" tone="neutral" />}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{event.title}</h1>
            {spaceName && (
              <Link to="/spaces/$spaceId" params={{ spaceId: event.space_id }} className="text-sm text-primary hover:underline">
                in {spaceName}
              </Link>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <div className="flex items-center gap-2"><Calendar className="size-4 text-muted-foreground" />{formatEventDate(event.start_time, event.timezone)}</div>
            <div className="flex items-center gap-2"><Clock className="size-4 text-muted-foreground" />Ends {formatEventDate(event.end_time, event.timezone)} ({event.timezone})</div>
            {event.location && <div className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" />{event.location}</div>}
            {event.virtual_link && (
              <div className="flex items-center gap-2"><Video className="size-4 text-muted-foreground" />Virtual event</div>
            )}
          </div>

          {event.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{event.description}</p>}

          <div className="flex items-center gap-3 pt-2 border-t">
            <RSVPButton event={event} myRsvp={myRsvp} goingCount={goingCount} onChange={load} />
            <span className="text-sm text-muted-foreground">{goingCount} going{event.rsvp_limit ? ` of ${event.rsvp_limit}` : ""}</span>
          </div>
        </CardContent>
      </Card>

      {event.event_type === "livestream_placeholder" ? (
        <LockedContentCard title="Livestream support coming later" description="Live streaming will be available in a future release." />
      ) : locked ? (
        <LockedContentCard title="Paid event — coming soon" description="Paid event support will be available in a future phase." />
      ) : event.virtual_link ? (
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">Virtual join link</h3>
            {myRsvp?.status === "going" ? (
              <Button asChild variant="outline"><a href={event.virtual_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" />Open link</a></Button>
            ) : (
              <p className="text-sm text-muted-foreground">RSVP to reveal the virtual join link.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <AttendeeList attendees={attendees} />
        </CardContent>
      </Card>
    </div>
  );
}
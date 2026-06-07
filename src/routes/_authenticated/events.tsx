import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchEvents, isPast, type EventRow } from "@/lib/events";
import type { Space } from "@/lib/spaces";
import { EventCard } from "@/components/events/EventCard";
import { EventFilters, type EventTimeFilter } from "@/components/events/EventFilters";
import { EmptyState } from "@/components/app/DashboardCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/events")({
  component: EventsPage,
});

function EventsPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({});

  const [q, setQ] = useState("");
  const [spaceId, setSpaceId] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState<EventTimeFilter>("upcoming");

  const load = async () => {
    setLoading(true);
    const [list, { data: sp }] = await Promise.all([
      fetchEvents(),
      supabase.from("spaces").select("*").eq("is_archived", false).order("sort_order"),
    ]);
    setEvents(list);
    setSpaces((sp ?? []) as Space[]);
    const { data: rsvps } = await (supabase as any).from("event_rsvps").select("event_id,status");
    const counts: Record<string, number> = {};
    (rsvps ?? []).forEach((r: { event_id: string; status: string }) => {
      if (r.status === "going") counts[r.event_id] = (counts[r.event_id] ?? 0) + 1;
    });
    setRsvpCounts(counts);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const spaceById = useMemo(() => new Map(spaces.map((s) => [s.id, s])), [spaces]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (q && !e.title.toLowerCase().includes(q.toLowerCase())) return false;
      if (spaceId !== "all" && e.space_id !== spaceId) return false;
      if (typeFilter !== "all" && e.event_type !== typeFilter) return false;
      const past = isPast(e);
      if (timeFilter === "upcoming" && past) return false;
      if (timeFilter === "past" && !past) return false;
      return true;
    });
  }, [events, q, spaceId, typeFilter, timeFilter]);

  const upcoming = filtered.filter((e) => !isPast(e));
  const past = filtered.filter((e) => isPast(e));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Live Events</h1>
        <p className="text-muted-foreground mt-1">
          Join upcoming live sessions, workshops, community calls, and special events.
        </p>
      </header>

      <EventFilters
        q={q} setQ={setQ}
        spaceId={spaceId} setSpaceId={setSpaceId}
        typeFilter={typeFilter} setTypeFilter={setTypeFilter}
        timeFilter={timeFilter} setTimeFilter={setTimeFilter}
        spaces={spaces}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Calendar className="size-5" />}
          title="No events scheduled yet"
          description="No events are scheduled yet. Upcoming sessions will appear here soon."
        />
      ) : (
        <div className="space-y-8">
          {(timeFilter !== "past") && upcoming.length > 0 && (
            <Section title="Upcoming" events={upcoming} spaceById={spaceById} rsvpCounts={rsvpCounts} />
          )}
          {(timeFilter !== "upcoming") && past.length > 0 && (
            <Section title="Past" events={past} spaceById={spaceById} rsvpCounts={rsvpCounts} />
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title, events, spaceById, rsvpCounts,
}: {
  title: string;
  events: EventRow[];
  spaceById: Map<string, Space>;
  rsvpCounts: Record<string, number>;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <EventCard
            key={e.id}
            event={e}
            spaceName={spaceById.get(e.space_id)?.name}
            rsvpCount={rsvpCounts[e.id] ?? 0}
          />
        ))}
      </div>
    </section>
  );
}
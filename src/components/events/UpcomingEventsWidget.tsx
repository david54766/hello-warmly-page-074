import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, StatusPill } from "@/components/app/DashboardCard";
import { fetchEvents, formatEventDate, EVENT_TYPE_LABELS, type EventRow } from "@/lib/events";

export function UpcomingEventsWidget({ spaceId, limit = 3 }: { spaceId?: string; limit?: number }) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchEvents({ spaceId, upcomingOnly: true });
        setEvents(list.slice(0, limit));
      } finally {
        setLoading(false);
      }
    })();
  }, [spaceId, limit]);

  if (loading) return <div className="space-y-2">{Array.from({ length: limit }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;
  if (events.length === 0) {
    return <EmptyState icon={<Calendar className="size-5" />} title="No upcoming events" description="Upcoming sessions will appear here." />;
  }
  return (
    <ul className="space-y-2">
      {events.map((e) => (
        <li key={e.id}>
          <Card className="rounded-xl">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center"><Calendar className="size-5" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium truncate">{e.title}</p>
                  <StatusPill label={EVENT_TYPE_LABELS[e.event_type]} tone="info" />
                </div>
                <p className="text-xs text-muted-foreground">{formatEventDate(e.start_time, e.timezone)}</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/events/$eventId" params={{ eventId: e.id }}>View <ArrowRight className="size-4 ml-1" /></Link>
              </Button>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
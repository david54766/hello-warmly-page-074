import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Lock, Video, MapPin } from "lucide-react";
import {
  EVENT_TYPE_LABELS,
  formatEventDate,
  isLocked,
  isPast,
  type EventRow,
} from "@/lib/events";
import { StatusPill } from "@/components/app/DashboardCard";
import { SaveButton } from "@/components/onboarding/SaveButton";

export function EventCard({
  event,
  spaceName,
  rsvpCount = 0,
  rsvpStatus,
}: {
  event: EventRow;
  spaceName?: string;
  rsvpCount?: number;
  rsvpStatus?: "going" | "waitlist" | "not_going" | null;
}) {
  const past = isPast(event);
  const locked = isLocked(event);
  const canceled = event.status === "canceled";
  return (
    <Card className="rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {event.cover_image_url ? (
        <div className="aspect-[16/9] bg-muted overflow-hidden">
          <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-gradient-to-br from-primary/15 to-primary/5 grid place-items-center">
          <Calendar className="size-8 text-primary/60" />
        </div>
      )}
      <CardContent className="pt-5 flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPill label={EVENT_TYPE_LABELS[event.event_type]} tone="info" />
          {canceled && <StatusPill label="Canceled" tone="warn" />}
          {past && !canceled && <StatusPill label="Completed" tone="neutral" />}
          {locked && <StatusPill label="Paid" tone="warn" />}
        </div>
        <div>
          <h3 className="font-semibold leading-tight">{event.title}</h3>
          {spaceName && <p className="text-xs text-muted-foreground mt-0.5">{spaceName}</p>}
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-1.5"><Calendar className="size-3.5" />{formatEventDate(event.start_time, event.timezone)}</div>
          {event.location && <div className="flex items-center gap-1.5"><MapPin className="size-3.5" />{event.location}</div>}
          {event.virtual_link && !event.location && (
            <div className="flex items-center gap-1.5"><Video className="size-3.5" />Virtual</div>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" />{rsvpCount} {rsvpCount === 1 ? "going" : "going"}
            {rsvpStatus === "going" && <StatusPill label="You're in" tone="success" />}
            {rsvpStatus === "waitlist" && <StatusPill label="Waitlist" tone="warn" />}
          </div>
          <div className="flex items-center gap-1">
            <SaveButton targetType="event" targetId={event.id} />
            <Button size="sm" variant={locked ? "outline" : "default"} asChild>
              <Link to="/events/$eventId" params={{ eventId: event.id }}>
                {locked ? <><Lock className="size-3.5" />View</> : "View"}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { RsvpRow } from "@/lib/events";

export interface Attendee {
  rsvp: RsvpRow;
  profile: { id: string; full_name: string | null; avatar_url: string | null } | null;
}

export function AttendeeList({ attendees, title = "Attendees" }: { attendees: Attendee[]; title?: string }) {
  const going = attendees.filter((a) => a.rsvp.status === "going");
  const waitlist = attendees.filter((a) => a.rsvp.status === "waitlist");
  if (going.length === 0 && waitlist.length === 0) {
    return <p className="text-sm text-muted-foreground">No one has RSVPed yet. Be the first!</p>;
  }
  return (
    <div className="space-y-4">
      <Section title={`${title} (${going.length})`} list={going} />
      {waitlist.length > 0 && <Section title={`Waitlist (${waitlist.length})`} list={waitlist} />}
    </div>
  );
}

function Section({ title, list }: { title: string; list: Attendee[] }) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">{title}</h4>
      <ul className="flex flex-wrap gap-3">
        {list.map((a) => {
          const name = a.profile?.full_name ?? "Member";
          return (
            <li key={a.rsvp.id} className="flex items-center gap-2 rounded-full bg-muted/60 pl-1 pr-3 py-1">
              <Avatar className="size-7">
                <AvatarImage src={a.profile?.avatar_url ?? undefined} />
                <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-xs">{name}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
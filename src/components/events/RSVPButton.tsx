import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Lock, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  deleteRsvp,
  isLocked,
  isPast,
  setRsvp,
  type EventRow,
  type RsvpRow,
} from "@/lib/events";

export function RSVPButton({
  event,
  myRsvp,
  goingCount,
  onChange,
}: {
  event: EventRow;
  myRsvp: RsvpRow | null;
  goingCount: number;
  onChange: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (isLocked(event)) {
    return (
      <Button variant="outline" disabled>
        <Lock className="size-4" />
        Paid event — coming soon
      </Button>
    );
  }
  if (event.status === "canceled") return <Button variant="outline" disabled>Canceled</Button>;
  if (isPast(event)) return <Button variant="outline" disabled>Event ended</Button>;

  const isFull = !!event.rsvp_limit && goingCount >= event.rsvp_limit && myRsvp?.status !== "going";

  const handle = async (next: "going" | "waitlist" | "cancel") => {
    if (!user) return;
    setLoading(true);
    try {
      if (next === "cancel") {
        await deleteRsvp(event.id, user.id);
        toast.success("RSVP canceled");
      } else {
        await setRsvp(event.id, user.id, next);
        toast.success(next === "waitlist" ? "Added to waitlist" : "You're going!");
      }
      onChange();
    } catch (e) {
      toast.error((e as Error).message ?? "Could not update RSVP");
    } finally {
      setLoading(false);
    }
  };

  if (myRsvp?.status === "going") {
    return (
      <div className="flex gap-2">
        <Button variant="secondary" disabled><Check className="size-4" />Going</Button>
        <Button variant="ghost" size="sm" onClick={() => handle("cancel")} disabled={loading}>
          <X className="size-4" />Cancel
        </Button>
      </div>
    );
  }
  if (myRsvp?.status === "waitlist") {
    return (
      <div className="flex gap-2">
        <Button variant="secondary" disabled>On waitlist</Button>
        <Button variant="ghost" size="sm" onClick={() => handle("cancel")} disabled={loading}>Leave</Button>
      </div>
    );
  }
  if (isFull) {
    return <Button onClick={() => handle("waitlist")} disabled={loading} variant="outline">Join waitlist</Button>;
  }
  return <Button onClick={() => handle("going")} disabled={loading}>RSVP</Button>;
}
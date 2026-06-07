import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Users2 } from "lucide-react";
import { highestRole, memberInitials, relativeTime, type MemberSummary } from "@/lib/members";
import { RolePill } from "./RolePill";
import { StatusPill } from "./StatusPill";
import { MessageMemberButton } from "@/components/chat/MessageMemberButton";
import { FollowButton } from "@/components/onboarding/FollowButton";

export function MemberCard({ member, showStatus }: { member: MemberSummary; showStatus?: boolean }) {
  const role = highestRole(member.roles);
  return (
    <Card className="rounded-2xl overflow-hidden group transition-shadow hover:shadow-md">
      <div
        className="h-16 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent"
        style={member.cover_image_url ? { backgroundImage: `url(${member.cover_image_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      />
      <CardContent className="-mt-8 pb-5">
        <div className="flex items-start gap-3">
          <Avatar className="size-16 ring-4 ring-background">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback>{memberInitials(member.full_name, member.email)}</AvatarFallback>
          </Avatar>
          <div className="pt-8 flex items-center gap-1.5 flex-wrap">
            <RolePill role={role} />
            {showStatus && <StatusPill status={member.status} />}
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <p className="font-semibold leading-tight truncate">{member.full_name || "Unnamed member"}</p>
          {member.headline && <p className="text-sm text-muted-foreground line-clamp-1">{member.headline}</p>}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {member.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{member.location}</span>}
          <span className="inline-flex items-center gap-1"><Users2 className="size-3" />{member.spaces_joined} space{member.spaces_joined === 1 ? "" : "s"}</span>
          <span>Active {relativeTime(member.last_active_at)}</span>
        </div>
        <div className="mt-4 flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to="/members/$userId" params={{ userId: member.id }}>View profile</Link>
          </Button>
          <FollowButton userId={member.id} />
          <MessageMemberButton memberId={member.id} />
        </div>
      </CardContent>
    </Card>
  );
}
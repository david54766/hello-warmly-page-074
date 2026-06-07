import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Edit3, MapPin, ExternalLink, Shield } from "lucide-react";
import { highestRole, memberInitials, type MemberSummary } from "@/lib/members";
import { RolePill } from "./RolePill";
import { StatusPill } from "./StatusPill";
import { MessageMemberButton } from "@/components/chat/MessageMemberButton";

export function ProfileHeader({
  member,
  isSelf,
  isAdmin,
}: {
  member: MemberSummary;
  isSelf?: boolean;
  isAdmin?: boolean;
}) {
  const role = highestRole(member.roles);
  const social = member.social_links_json ?? {};
  return (
    <div className="rounded-3xl overflow-hidden border bg-card">
      <div
        className="h-40 sm:h-56 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent"
        style={member.cover_image_url ? { backgroundImage: `url(${member.cover_image_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      />
      <div className="px-6 sm:px-8 pb-6">
        <div className="flex flex-wrap items-end gap-4 -mt-12">
          <Avatar className="size-24 ring-4 ring-background">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback className="text-xl">{memberInitials(member.full_name, member.email)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 pt-12">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight truncate">{member.full_name || "Unnamed member"}</h1>
              <RolePill role={role} />
              {member.status !== "active" && <StatusPill status={member.status} />}
            </div>
            {member.headline && <p className="text-muted-foreground mt-1">{member.headline}</p>}
          </div>
          <div className="flex flex-wrap gap-2 pt-12">
            {isSelf && (
              <Button asChild size="sm" variant="outline"><Link to="/profile"><Edit3 className="size-4 mr-1.5" />Edit profile</Link></Button>
            )}
            {!isSelf && <MessageMemberButton memberId={member.id} variant="default" />}
            {isAdmin && !isSelf && (
              <Button asChild size="sm" variant="outline"><Link to="/admin/members/$userId" params={{ userId: member.id }}><Shield className="size-4 mr-1.5" />Admin actions</Link></Button>
            )}
          </div>
        </div>

        {(member.bio || member.location || member.website_url || Object.keys(social).length > 0) && (
          <div className="mt-5 space-y-3">
            {member.bio && <p className="text-sm leading-relaxed whitespace-pre-wrap">{member.bio}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {member.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{member.location}</span>}
              {member.website_url && (
                <a href={member.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                  <ExternalLink className="size-3.5" />Website
                </a>
              )}
              {Object.entries(social).map(([k, v]) =>
                v ? (
                  <a key={k} href={v as string} target="_blank" rel="noreferrer" className="hover:text-foreground capitalize">{k}</a>
                ) : null,
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
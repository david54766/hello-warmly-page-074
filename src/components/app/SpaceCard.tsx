import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Lock } from "lucide-react";
import { getIcon, isLocked, type Space } from "@/lib/spaces";
import { PrivacyPill } from "./PrivacyPill";
import { AccessPill } from "./AccessPill";
import { JoinSpaceButton } from "./JoinSpaceButton";
import { SaveButton } from "@/components/onboarding/SaveButton";

export function SpaceCard({
  space,
  collectionName,
  memberCount,
  isMember,
  onJoinChange,
}: {
  space: Space;
  collectionName?: string | null;
  memberCount: number;
  isMember: boolean;
  onJoinChange?: () => void;
}) {
  const Icon = getIcon(space.icon);
  const locked = isLocked(space) && !isMember;

  return (
    <Card className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="aspect-[16/7] w-full bg-gradient-to-br from-primary/15 via-primary/5 to-accent relative">
        {space.cover_image_url && (
          <img src={space.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute bottom-3 left-3 size-10 rounded-xl bg-background/95 backdrop-blur grid place-items-center shadow">
          <Icon className="size-5 text-primary" />
        </div>
        {locked && (
          <div className="absolute top-3 right-3 size-8 rounded-full bg-background/95 backdrop-blur grid place-items-center shadow">
            <Lock className="size-3.5" />
          </div>
        )}
      </div>
      <CardContent className="flex-1 flex flex-col gap-3 pt-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {collectionName && <span className="font-medium">{collectionName}</span>}
          <PrivacyPill level={space.privacy_level} />
          <AccessPill level={space.access_level} />
        </div>
        <div>
          <h3 className="font-semibold tracking-tight">{space.name}</h3>
          {space.tagline && <p className="text-sm text-muted-foreground">{space.tagline}</p>}
        </div>
        {space.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{space.description}</p>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          {memberCount} member{memberCount === 1 ? "" : "s"}
        </div>
        <div className="flex items-center gap-2 mt-auto pt-2">
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link to="/spaces/$spaceId" params={{ spaceId: space.id }}>View</Link>
          </Button>
          <JoinSpaceButton space={space} isMember={isMember} onChange={onJoinChange} size="sm" />
          <SaveButton targetType="space" targetId={space.id} />
        </div>
      </CardContent>
    </Card>
  );
}
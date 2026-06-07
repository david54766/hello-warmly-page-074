import { Users } from "lucide-react";
import { getIcon, type Space } from "@/lib/spaces";
import { PrivacyPill } from "./PrivacyPill";
import { AccessPill } from "./AccessPill";
import { JoinSpaceButton } from "./JoinSpaceButton";

export function SpaceHeader({
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
  return (
    <div className="space-y-4">
      <div className="aspect-[16/5] w-full rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent relative overflow-hidden">
        {space.cover_image_url && (
          <img src={space.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>
      <div className="flex flex-wrap items-start gap-4">
        <div className="size-14 -mt-12 ml-2 rounded-2xl bg-background grid place-items-center shadow-md ring-1 ring-border">
          <Icon className="size-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-1">
            {collectionName && <span className="font-medium">{collectionName}</span>}
            <PrivacyPill level={space.privacy_level} />
            <AccessPill level={space.access_level} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{space.name}</h1>
          {space.tagline && <p className="text-muted-foreground mt-1">{space.tagline}</p>}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
            <Users className="size-4" />
            {memberCount} member{memberCount === 1 ? "" : "s"}
          </div>
        </div>
        <div className="w-full sm:w-auto sm:min-w-[160px] flex">
          <JoinSpaceButton space={space} isMember={isMember} onChange={onJoinChange} />
        </div>
      </div>
    </div>
  );
}
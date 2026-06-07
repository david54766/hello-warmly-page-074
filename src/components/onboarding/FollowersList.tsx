import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { memberInitials } from "@/lib/members";
import { EmptyState } from "@/components/app/DashboardCard";
import { Users2 } from "lucide-react";
import { FollowButton } from "./FollowButton";

type Profile = { id: string; full_name: string | null; email: string | null; avatar_url: string | null; headline: string | null };

export function FollowersList({ userIds, emptyTitle = "No followers yet", emptyDescription = "When someone follows you, they'll show up here." }: { userIds: string[]; emptyTitle?: string; emptyDescription?: string }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  useEffect(() => {
    if (!userIds.length) return setProfiles([]);
    (async () => {
      const { data } = await supabase.from("profiles").select("id,full_name,email,avatar_url,headline").in("id", userIds);
      setProfiles((data ?? []) as Profile[]);
    })();
  }, [userIds.join(",")]);

  if (userIds.length === 0) {
    return <EmptyState icon={<Users2 className="size-5" />} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className="divide-y rounded-2xl border bg-card">
      {profiles.map((p) => (
        <li key={p.id} className="flex items-center gap-3 p-3">
          <Link to="/members/$userId" params={{ userId: p.id }}>
            <Avatar className="size-10"><AvatarImage src={p.avatar_url || undefined} /><AvatarFallback>{memberInitials(p.full_name, p.email)}</AvatarFallback></Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link to="/members/$userId" params={{ userId: p.id }} className="font-medium text-sm hover:underline truncate block">
              {p.full_name || "Unnamed member"}
            </Link>
            {p.headline && <p className="text-xs text-muted-foreground truncate">{p.headline}</p>}
          </div>
          <FollowButton userId={p.id} />
        </li>
      ))}
    </ul>
  );
}

export const FollowingList = FollowersList;
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "./DashboardCard";
import { Users } from "lucide-react";

export interface SpaceMemberRow {
  user_id: string;
  role: string;
  joined_at: string;
  profile: { full_name: string | null; email: string | null; avatar_url: string | null } | null;
}

export function SpaceMemberList({ members }: { members: SpaceMemberRow[] }) {
  if (members.length === 0) {
    return <EmptyState icon={<Users className="size-5" />} title="No members yet" description="Be the first to join this Space." />;
  }
  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
      {members.map((m) => {
        const name = m.profile?.full_name || m.profile?.email || "Member";
        const initials = name.slice(0, 2).toUpperCase();
        return (
          <li key={m.user_id} className="flex items-center gap-3 p-3">
            <Avatar className="size-9">
              {m.profile?.avatar_url && <AvatarImage src={m.profile.avatar_url} alt="" />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{name}</p>
              <p className="text-xs text-muted-foreground">Joined {new Date(m.joined_at).toLocaleDateString()}</p>
            </div>
            {m.role !== "member" && <Badge variant="secondary" className="capitalize">{m.role.replace("_", " ")}</Badge>}
          </li>
        );
      })}
    </ul>
  );
}
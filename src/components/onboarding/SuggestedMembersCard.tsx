import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchMembers, memberInitials, type MemberSummary } from "@/lib/members";
import { fetchFollowing } from "@/lib/onboarding";
import { FollowButton } from "./FollowButton";
import { EmptyState } from "@/components/app/DashboardCard";

export function SuggestedMembersCard({ limit = 4 }: { limit?: number }) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<MemberSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = async () => {
    if (!user) return;
    const [members, following] = await Promise.all([fetchMembers(), fetchFollowing(user.id)]);
    const followSet = new Set(following);
    const filtered = members
      .filter((m) => m.id !== user.id && m.status === "active" && !followSet.has(m.id))
      .slice(0, limit);
    setSuggestions(filtered);
    setLoaded(true);
  };
  useEffect(() => { reload(); }, [user, limit]);

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-medium">
          <Sparkles className="size-4" />Suggested members
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loaded && suggestions.length === 0 ? (
          <EmptyState title="You're following everyone" description="Check back later for new members." />
        ) : (
          suggestions.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <Link to="/members/$userId" params={{ userId: m.id }}>
                <Avatar className="size-9">
                  <AvatarImage src={m.avatar_url || undefined} />
                  <AvatarFallback>{memberInitials(m.full_name, m.email)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link to="/members/$userId" params={{ userId: m.id }} className="text-sm font-medium hover:underline truncate block">
                  {m.full_name || "Unnamed member"}
                </Link>
                {m.headline && <p className="text-xs text-muted-foreground truncate">{m.headline}</p>}
              </div>
              <FollowButton userId={m.id} onChange={() => reload()} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
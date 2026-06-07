import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchUserBadges, fetchUserPointsTotal, type UserBadge } from "@/lib/gamification";
import { PointsDisplay } from "./PointsDisplay";
import { BadgePill } from "./BadgePill";
import { Award } from "lucide-react";

export function MemberAchievementPanel({ userId }: { userId: string }) {
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  useEffect(() => {
    fetchUserPointsTotal(userId).then(setPoints);
    fetchUserBadges(userId).then(setBadges);
  }, [userId]);
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2"><Award className="size-4" />Achievements</CardTitle>
        <PointsDisplay points={points} />
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          <p className="text-sm text-muted-foreground">No badges yet. Stay active to earn your first one.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {badges.map((ub) => ub.badge && <BadgePill key={ub.id} badge={ub.badge} />)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeGrid } from "@/components/gamification/BadgeGrid";
import { PointsDisplay } from "@/components/gamification/PointsDisplay";
import { PointsLedgerTable } from "@/components/gamification/PointsLedgerTable";
import { fetchBadges, fetchUserBadges, fetchUserPointsLedger, fetchUserPointsTotal, type Badge, type PointsEntry, type UserBadge } from "@/lib/gamification";
import { Award } from "lucide-react";

export const Route = createFileRoute("/_authenticated/achievements")({ component: AchievementsPage });

function AchievementsPage() {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [mine, setMine] = useState<UserBadge[]>([]);
  const [ledger, setLedger] = useState<PointsEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchUserPointsTotal(user.id).then(setPoints);
    fetchBadges().then(setBadges);
    fetchUserBadges(user.id).then(setMine);
    fetchUserPointsLedger(user.id).then(setLedger);
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Award className="size-3.5" />Your progress</div>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">My Achievements</h1>
          <p className="text-muted-foreground mt-1">Track your progress, celebrate milestones, and see how you are contributing to the community.</p>
        </div>
        <PointsDisplay points={points} size="lg" />
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-3">Badges</h2>
        <BadgeGrid badges={badges} userBadges={mine} />
      </section>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base">Points history</CardTitle></CardHeader>
        <CardContent><PointsLedgerTable rows={ledger} /></CardContent>
      </Card>
    </div>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaderboardTable } from "@/components/gamification/LeaderboardTable";
import { fetchLeaderboard, type LeaderboardPeriod, type LeaderboardRow } from "@/lib/gamification";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/leaderboard")({ component: LeaderboardPage });

function LeaderboardPage() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("all_time");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetchLeaderboard(period, 50).then((r) => { setRows(r); setLoading(false); });
  }, [period]);
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header>
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Trophy className="size-3.5" />Community</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">Community Leaderboard</h1>
        <p className="text-muted-foreground mt-1">Celebrate the members who are learning, sharing, and contributing the most.</p>
      </header>
      <Tabs value={period} onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}>
        <TabsList>
          <TabsTrigger value="all_time">All time</TabsTrigger>
          <TabsTrigger value="month">This month</TabsTrigger>
          <TabsTrigger value="week">This week</TabsTrigger>
        </TabsList>
      </Tabs>
      {loading ? (
        <Card className="rounded-2xl"><CardContent className="pt-5 text-sm text-muted-foreground">Loading…</CardContent></Card>
      ) : (
        <LeaderboardTable rows={rows} />
      )}
    </div>
  );
}
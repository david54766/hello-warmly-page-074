import { useEffect, useState } from "react";
import { viewStats } from "@/lib/announcements";

export function AnnouncementViewStats({ announcementId }: { announcementId: string }) {
  const [stats, setStats] = useState<{ views: number; dismissed: number } | null>(null);
  useEffect(() => { viewStats(announcementId).then(setStats); }, [announcementId]);
  if (!stats) return <p className="text-sm text-muted-foreground">Loading stats…</p>;
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="rounded-lg border p-3"><p className="text-muted-foreground text-xs">Views</p><p className="text-2xl font-semibold">{stats.views}</p></div>
      <div className="rounded-lg border p-3"><p className="text-muted-foreground text-xs">Dismissed</p><p className="text-2xl font-semibold">{stats.dismissed}</p></div>
    </div>
  );
}
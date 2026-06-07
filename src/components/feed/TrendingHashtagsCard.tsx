import { useEffect, useState } from "react";
import { DashboardCard, EmptyState } from "@/components/app/DashboardCard";
import { HashtagPill } from "./HashtagPill";
import { Hash } from "lucide-react";
import { fetchTrendingHashtags } from "@/lib/postExtras";
import type { Hashtag } from "@/lib/feed";

export function TrendingHashtagsCard({ limit = 10 }: { limit?: number }) {
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<Hashtag[]>([]);

  useEffect(() => {
    fetchTrendingHashtags(limit).then((t) => { setTags(t); setLoading(false); });
  }, [limit]);

  return (
    <DashboardCard title="Trending Hashtags" icon={<Hash className="size-4" />}>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tags.length === 0 ? (
        <EmptyState icon={<Hash className="size-5" />} title="No hashtags yet" description="Tag your posts with #topic to start trends." />
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <HashtagPill key={t.id} name={t.name} />
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
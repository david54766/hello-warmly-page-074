import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DashboardCard, EmptyState } from "@/components/app/DashboardCard";
import { BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Poll } from "@/lib/feed";

interface Row { poll: Poll; postTitle: string | null; postId: string; voteCount: number }

export function ActivePollsWidget({ limit = 3 }: { limit?: number }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const sb = supabase as any;
      const { data: polls } = await sb
        .from("polls")
        .select("*")
        .or(`closes_at.is.null,closes_at.gt.${new Date().toISOString()}`)
        .order("created_at", { ascending: false })
        .limit(limit);
      const list = (polls ?? []) as Poll[];
      if (!list.length) { setRows([]); setLoading(false); return; }
      const postIds = list.map((p) => p.post_id);
      const pollIds = list.map((p) => p.id);
      const [{ data: posts }, { data: votes }] = await Promise.all([
        sb.from("posts").select("id,title,status").in("id", postIds).eq("status", "active"),
        sb.from("poll_votes").select("poll_id").in("poll_id", pollIds),
      ]);
      const postsMap = new Map(((posts ?? []) as { id: string; title: string | null }[]).map((p) => [p.id, p.title]));
      const counts = new Map<string, number>();
      ((votes ?? []) as { poll_id: string }[]).forEach((v) => counts.set(v.poll_id, (counts.get(v.poll_id) ?? 0) + 1));
      setRows(list
        .filter((p) => postsMap.has(p.post_id))
        .map((p) => ({ poll: p, postId: p.post_id, postTitle: postsMap.get(p.post_id) ?? p.question, voteCount: counts.get(p.id) ?? 0 }))
      );
      setLoading(false);
    })();
  }, [limit]);

  return (
    <DashboardCard title="Active Polls" icon={<BarChart3 className="size-4" />}>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState icon={<BarChart3 className="size-5" />} title="No active polls" description="Polls created by members will appear here." />
      ) : (
        <ul className="divide-y divide-border -mx-1">
          {rows.map((r) => (
            <li key={r.poll.id}>
              <Link to="/posts/$postId" params={{ postId: r.postId }} className="block px-1 py-2.5 rounded-lg hover:bg-accent transition-colors">
                <div className="text-sm font-medium truncate">{r.postTitle ?? r.poll.question}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {r.voteCount} {r.voteCount === 1 ? "vote" : "votes"}
                  {r.poll.closes_at && ` · closes ${new Date(r.poll.closes_at).toLocaleDateString()}`}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2">
        <Button size="sm" variant="ghost" asChild><Link to="/feed">Open feed <ArrowRight className="size-4 ml-1" /></Link></Button>
      </div>
    </DashboardCard>
  );
}
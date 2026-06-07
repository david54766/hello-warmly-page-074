import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DashboardCard, EmptyState } from "@/components/app/DashboardCard";
import { HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Row { id: string; title: string | null; body: string; created_at: string }

export function UnansweredQuestionsWidget({ limit = 4 }: { limit?: number }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const sb = supabase as any;
      const { data: posts } = await sb
        .from("posts")
        .select("id,title,body,created_at")
        .eq("post_type", "question")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);
      const list = (posts ?? []) as Row[];
      if (!list.length) { setRows([]); setLoading(false); return; }
      const { data: qd } = await sb
        .from("question_details")
        .select("post_id,is_answered")
        .in("post_id", list.map((p) => p.id));
      const answered = new Set(((qd ?? []) as { post_id: string; is_answered: boolean }[])
        .filter((q) => q.is_answered).map((q) => q.post_id));
      setRows(list.filter((p) => !answered.has(p.id)).slice(0, limit));
      setLoading(false);
    })();
  }, [limit]);

  return (
    <DashboardCard title="Unanswered Questions" icon={<HelpCircle className="size-4" />}>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState icon={<HelpCircle className="size-5" />} title="All caught up" description="No open questions need help right now." />
      ) : (
        <ul className="divide-y divide-border -mx-1">
          {rows.map((r) => (
            <li key={r.id}>
              <Link to="/posts/$postId" params={{ postId: r.id }} className="block px-1 py-2.5 rounded-lg hover:bg-accent transition-colors">
                <div className="text-sm font-medium truncate">{r.title ?? r.body.slice(0, 80)}</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{r.body.slice(0, 120)}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2">
        <Button size="sm" variant="ghost" asChild><Link to="/feed">Help out <ArrowRight className="size-4 ml-1" /></Link></Button>
      </div>
    </DashboardCard>
  );
}
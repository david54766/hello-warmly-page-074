import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart3, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Poll, PollOption, PollVote } from "@/lib/feed";
import { toast } from "sonner";

export function PollCard({ postId }: { postId: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const sb = supabase as any;
    const { data: p } = await sb.from("polls").select("*").eq("post_id", postId).maybeSingle();
    if (!p) { setPoll(null); setLoading(false); return; }
    setPoll(p as Poll);
    const [{ data: os }, { data: vs }] = await Promise.all([
      sb.from("poll_options").select("*").eq("poll_id", p.id).order("sort_order"),
      sb.from("poll_votes").select("*").eq("poll_id", p.id),
    ]);
    setOptions((os ?? []) as PollOption[]);
    setVotes((vs ?? []) as PollVote[]);
    setLoading(false);
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="size-3 animate-spin" />Loading poll…</div>;
  }
  if (!poll) return null;

  const myVotes = new Set(votes.filter((v) => v.user_id === user?.id).map((v) => v.option_id));
  const hasVoted = myVotes.size > 0;
  const closed = poll.closes_at ? new Date(poll.closes_at).getTime() < Date.now() : false;
  const totalVoters = new Set(votes.map((v) => v.user_id)).size;
  const showResults = hasVoted || closed;

  const toggle = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (!poll.allow_multiple) next.clear();
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const submit = async () => {
    if (!user || selected.size === 0) return;
    setBusy(true);
    const sb = supabase as any;
    if (!poll.allow_multiple) {
      await sb.from("poll_votes").delete().eq("poll_id", poll.id).eq("user_id", user.id);
    }
    const rows = Array.from(selected).map((option_id) => ({
      poll_id: poll.id, option_id, user_id: user.id,
    }));
    const { error } = await sb.from("poll_votes").insert(rows);
    setBusy(false);
    if (error) return toast.error(error.message);
    setSelected(new Set());
    load();
  };

  const clearVote = async () => {
    if (!user) return;
    setBusy(true);
    await (supabase as any).from("poll_votes").delete().eq("poll_id", poll.id).eq("user_id", user.id);
    setBusy(false);
    load();
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <BarChart3 className="size-3.5" />
          Poll {poll.allow_multiple && "· multi-select"}
        </div>
        {poll.closes_at && (
          <div className={cn("text-[11px] flex items-center gap-1", closed ? "text-destructive" : "text-muted-foreground")}>
            <Clock className="size-3" />
            {closed ? "Closed" : `Closes ${new Date(poll.closes_at).toLocaleString()}`}
          </div>
        )}
      </div>
      <ul className="space-y-1.5">
        {options.map((o) => {
          const count = votes.filter((v) => v.option_id === o.id).length;
          const pct = totalVoters ? Math.round((count / totalVoters) * 100) : 0;
          const mine = myVotes.has(o.id);
          const checked = selected.has(o.id) || mine;
          return (
            <li key={o.id}>
              {showResults ? (
                <div className={cn("relative rounded-lg border px-3 py-2 text-sm overflow-hidden", mine ? "border-primary" : "border-border")}>
                  <div className="absolute inset-y-0 left-0 bg-primary/10" style={{ width: `${pct}%` }} />
                  <div className="relative flex items-center justify-between gap-2">
                    <span className="truncate">{o.option_text}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{pct}% · {count}</span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => toggle(o.id)}
                  disabled={closed || busy}
                  className={cn(
                    "w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors",
                    checked ? "border-primary bg-primary/5" : "border-border hover:bg-accent",
                  )}
                >
                  {o.option_text}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="text-[11px] text-muted-foreground">{totalVoters} {totalVoters === 1 ? "vote" : "votes"}</div>
        {!showResults && !closed && (
          <Button size="sm" disabled={selected.size === 0 || busy} onClick={submit}>
            {busy ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : null}
            Vote
          </Button>
        )}
        {hasVoted && !closed && (
          <Button size="sm" variant="ghost" onClick={clearVote} disabled={busy}>Change vote</Button>
        )}
      </div>
    </div>
  );
}
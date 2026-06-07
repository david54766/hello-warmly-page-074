import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { REACTION_META, type Reaction, type ReactionType } from "@/lib/feed";
import { toast } from "sonner";

const TYPES: ReactionType[] = ["like", "love", "celebrate", "helpful"];

export function ReactionBar({
  targetType,
  targetId,
  reactions,
  onChange,
  compact,
}: {
  targetType: "post" | "comment";
  targetId: string;
  reactions: Reaction[];
  onChange: () => void;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => {
    const m = {} as Record<ReactionType, number>;
    TYPES.forEach((t) => (m[t] = 0));
    reactions.forEach((r) => { m[r.reaction_type] = (m[r.reaction_type] ?? 0) + 1; });
    return m;
  }, [reactions]);

  const mine = useMemo(() => {
    const s = new Set<ReactionType>();
    if (user) reactions.filter((r) => r.user_id === user.id).forEach((r) => s.add(r.reaction_type));
    return s;
  }, [reactions, user]);

  const toggle = async (rt: ReactionType) => {
    if (!user) return;
    setBusy(true);
    if (mine.has(rt)) {
      const { error } = await supabase.from("reactions").delete()
        .eq("user_id", user.id).eq("target_type", targetType).eq("target_id", targetId).eq("reaction_type", rt);
      setBusy(false);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("reactions")
        .insert({ user_id: user.id, target_type: targetType, target_id: targetId, reaction_type: rt });
      setBusy(false);
      if (error) return toast.error(error.message);
    }
    onChange();
  };

  const active = TYPES.filter((t) => counts[t] > 0);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {active.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => toggle(t)}
          disabled={busy}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
            mine.has(t)
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-background border-border hover:bg-accent"
          )}
          aria-label={`${REACTION_META[t].label} (${counts[t]})`}
        >
          <span aria-hidden>{REACTION_META[t].emoji}</span>
          <span>{counts[t]}</span>
        </button>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size={compact ? "sm" : "sm"} className="h-7 px-2 text-muted-foreground" disabled={busy || !user}>
            <SmilePlus className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1" align="start">
          <div className="flex gap-1">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggle(t)}
                disabled={busy}
                className={cn(
                  "rounded-full p-2 text-lg transition-transform hover:scale-125",
                  mine.has(t) && "bg-primary/10"
                )}
                aria-label={REACTION_META[t].label}
                title={REACTION_META[t].label}
              >
                {REACTION_META[t].emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
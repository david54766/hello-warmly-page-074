import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchChecklistItems, fetchChecklistProgress, type ChecklistItem } from "@/lib/onboarding";
import { ChecklistItemCard } from "@/components/onboarding/ChecklistItemCard";
import { ChecklistProgressBar } from "@/components/onboarding/ChecklistProgressBar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/getting-started")({
  component: GettingStartedPage,
});

function GettingStartedPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [its, prog] = await Promise.all([fetchChecklistItems(), fetchChecklistProgress(user.id)]);
      setItems(its);
      setCompleted(new Set(prog.map((p) => p.checklist_item_id)));
      setLoading(false);
    })();
  }, [user]);

  const total = items.length;
  const done = items.filter((i) => completed.has(i.id)).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Get started in the community.</h1>
        <p className="text-muted-foreground mt-1">Complete these quick steps to unlock the full member experience.</p>
      </header>
      <Card className="rounded-2xl"><CardContent className="pt-5"><ChecklistProgressBar completed={done} total={total} /></CardContent></Card>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {items.map((it, idx) => <ChecklistItemCard key={it.id} item={it} completed={completed.has(it.id)} index={idx} />)}
        </div>
      )}
    </div>
  );
}
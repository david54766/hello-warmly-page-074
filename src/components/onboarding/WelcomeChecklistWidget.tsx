import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Circle, Sparkles, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchChecklistItems, fetchChecklistProgress, type ChecklistItem } from "@/lib/onboarding";
import { ChecklistProgressBar } from "./ChecklistProgressBar";

const DISMISS_KEY = "memberhub:welcome-checklist-dismissed";

export function WelcomeChecklistWidget() {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [its, prog] = await Promise.all([fetchChecklistItems(), fetchChecklistProgress(user.id)]);
      setItems(its);
      setCompleted(new Set(prog.map((p) => p.checklist_item_id)));
    })();
  }, [user]);

  if (dismissed) return null;
  if (items.length === 0) return null;
  const total = items.length;
  const doneCount = items.filter((i) => completed.has(i.id)).length;
  const allDone = doneCount === total;
  if (allDone && dismissed) return null;

  const preview = items.slice(0, 4);

  return (
    <Card className="rounded-2xl border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" />
            Welcome checklist
          </div>
          <CardTitle className="mt-1 text-lg">Get started in the community.</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Complete these quick steps to unlock the full member experience.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Dismiss"
          title="Dismiss"
          onClick={() => { localStorage.setItem(DISMISS_KEY, "1"); setDismissed(true); }}
        >
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChecklistProgressBar completed={doneCount} total={total} />
        <ul className="space-y-1.5">
          {preview.map((it) => {
            const done = completed.has(it.id);
            return (
              <li key={it.id} className="flex items-center gap-2 text-sm">
                {done ? (
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="size-4 text-muted-foreground shrink-0" />
                )}
                <span className={done ? "text-muted-foreground line-through" : ""}>{it.title}</span>
              </li>
            );
          })}
        </ul>
        <Button asChild size="sm" variant="outline">
          <Link to="/getting-started">View all steps <ArrowRight className="size-4 ml-1" /></Link>
        </Button>
      </CardContent>
    </Card>
  );
}
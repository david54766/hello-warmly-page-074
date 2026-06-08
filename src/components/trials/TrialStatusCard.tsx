import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { daysRemaining, isTrialActive, TRIAL_STATUS_LABELS, type TrialRecord } from "@/lib/trials";

export function TrialStatusCard({ trial }: { trial: TrialRecord | null }) {
  if (!trial) return null;
  const active = isTrialActive(trial);
  return (
    <Card className="rounded-2xl border-blue-500/30 bg-blue-500/5">
      <CardContent className="pt-5 flex items-center gap-3">
        <div className="size-10 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-300 grid place-items-center"><Clock className="size-5" /></div>
        <div className="flex-1 min-w-0">
          {active ? (
            <>
              <p className="font-semibold">Your trial is active until {new Date(trial.ends_at).toLocaleDateString()}.</p>
              <p className="text-sm text-muted-foreground">{daysRemaining(trial)} day{daysRemaining(trial) === 1 ? "" : "s"} remaining.</p>
            </>
          ) : (
            <>
              <p className="font-semibold">Your trial has ended.</p>
              <p className="text-sm text-muted-foreground">Choose a plan to continue premium access.</p>
            </>
          )}
        </div>
        <Badge variant="outline" className="rounded-full">{TRIAL_STATUS_LABELS[trial.status]}</Badge>
      </CardContent>
    </Card>
  );
}
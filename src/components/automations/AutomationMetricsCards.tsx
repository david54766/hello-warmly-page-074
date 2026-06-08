import { Card, CardContent } from "@/components/ui/card";

interface Props {
  success: number; failed: number; skipped: number; lastRunAt: string | null; lastError?: string | null;
}

export function AutomationMetricsCards({ success, failed, skipped, lastRunAt, lastError }: Props) {
  const cards = [
    { label: "Success", value: success, tone: "text-green-600" },
    { label: "Failed", value: failed, tone: "text-destructive" },
    { label: "Skipped", value: skipped, tone: "text-muted-foreground" },
    { label: "Last run", value: lastRunAt ? new Date(lastRunAt).toLocaleString() : "—", tone: "text-foreground text-sm" },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="rounded-2xl">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
              <p className={`mt-1 font-semibold ${c.tone}`}>{typeof c.value === "number" ? c.value : c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {lastError && (
        <p className="text-xs text-destructive">Last error: {lastError}</p>
      )}
    </div>
  );
}
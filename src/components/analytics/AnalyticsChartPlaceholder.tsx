import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export function AnalyticsChartPlaceholder({ title, hint }: { title: string; hint?: string }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="size-4" />{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-40 rounded-xl border border-dashed border-muted-foreground/30 grid place-items-center text-xs text-muted-foreground">
          {hint ?? "Chart coming soon"}
        </div>
      </CardContent>
    </Card>
  );
}
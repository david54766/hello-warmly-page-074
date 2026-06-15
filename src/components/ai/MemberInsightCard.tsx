import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ENGAGEMENT_LABELS, RISK_LABELS, type AIMemberInsight, type MemberActivityStats } from "@/lib/memberAi";

function engagementVariant(level: string): any {
  return level === "high" ? "default" : level === "medium" ? "secondary" : level === "low" ? "outline" : "destructive";
}
function riskVariant(level: string): any {
  return level === "none" ? "outline" : level === "low" ? "secondary" : level === "medium" ? "default" : "destructive";
}

export function MemberInsightCard({ insight, stats }: { insight: AIMemberInsight; stats: MemberActivityStats | null }) {
  const copyMessage = async () => {
    if (!insight.suggested_message) return;
    await navigator.clipboard.writeText(insight.suggested_message);
    toast.success("Message copied");
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" /> AI Member Insight
        </CardTitle>
        <div className="flex gap-2 flex-wrap">
          <Badge variant={engagementVariant(insight.engagement_level)}>
            Engagement: {ENGAGEMENT_LABELS[insight.engagement_level]}
          </Badge>
          <Badge variant={riskVariant(insight.risk_level)}>
            Risk: {RISK_LABELS[insight.risk_level]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{insight.summary}</p>
        {stats && (
          <div className="grid grid-cols-3 gap-3 text-xs">
            <Stat label="Spaces" value={stats.spaces_joined} />
            <Stat label="Lessons" value={stats.lessons_completed} />
            <Stat label="Events" value={stats.events_rsvped} />
            <Stat label="Posts" value={stats.posts_created} />
            <Stat label="Comments" value={stats.comments_made} />
            <Stat label="Last active" value={stats.last_active_at ? new Date(stats.last_active_at).toLocaleDateString() : "Never"} />
          </div>
        )}
        {insight.suggested_actions_json.length > 0 && (
          <div>
            <div className="text-xs font-medium uppercase text-muted-foreground mb-2">Suggested actions</div>
            <ul className="text-sm space-y-1 list-disc list-inside">
              {insight.suggested_actions_json.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
        )}
        {insight.suggested_message && (
          <div className="rounded-md border bg-muted/30 p-3 space-y-2">
            <div className="text-xs font-medium uppercase text-muted-foreground">Suggested message</div>
            <p className="text-sm whitespace-pre-wrap">{insight.suggested_message}</p>
            <Button size="sm" variant="outline" onClick={copyMessage}><Copy className="size-3 mr-1" />Copy message</Button>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">Generated {new Date(insight.created_at).toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border p-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

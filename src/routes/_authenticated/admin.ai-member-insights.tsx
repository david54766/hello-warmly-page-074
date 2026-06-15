import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import {
  ENGAGEMENT_LABELS, RISK_LABELS, listInsights,
  type AIMemberInsight, type EngagementLevel, type RiskLevel,
} from "@/lib/memberAi";
import { AIMemberInsightsTable } from "@/components/ai/AIMemberInsightsTable";

export const Route = createFileRoute("/_authenticated/admin/ai-member-insights")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [insights, setInsights] = useState<AIMemberInsight[]>([]);
  const [engagement, setEngagement] = useState<EngagementLevel | "all">("all");
  const [risk, setRisk] = useState<RiskLevel | "all">("all");

  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/dashboard" }); }, [isAdmin, loading, nav]);
  useEffect(() => { if (isAdmin) listInsights({ engagement, risk }).then(setInsights); }, [isAdmin, engagement, risk]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <h1 className="text-2xl font-semibold">AI Member Insights</h1>
      </div>
      <p className="text-sm text-muted-foreground">AI-generated summaries and suggested actions for members. Generate from a member's detail page.</p>

      <Card>
        <CardHeader><CardTitle className="text-base">Filters</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div>
            <div className="text-xs mb-1 text-muted-foreground">Engagement</div>
            <Select value={engagement} onValueChange={(v) => setEngagement(v as any)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Object.entries(ENGAGEMENT_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs mb-1 text-muted-foreground">Risk</div>
            <Select value={risk} onValueChange={(v) => setRisk(v as any)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Object.entries(RISK_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <AIMemberInsightsTable insights={insights} />
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAutomation, fetchAutomation, fetchAutomationStats, fetchLogs, type Automation, type AutomationLog } from "@/lib/automations";
import { AutomationDetailCard } from "@/components/automations/AutomationDetailCard";
import { AutomationPreview } from "@/components/automations/AutomationPreview";
import { AutomationLogsTable } from "@/components/automations/AutomationLogsTable";
import { TestAutomationModal } from "@/components/automations/TestAutomationModal";
import { AutomationMetricsCards } from "@/components/automations/AutomationMetricsCards";
import { AutomationSafetyWarning } from "@/components/automations/AutomationSafetyWarning";

export const Route = createFileRoute("/_authenticated/admin/automations/$automationId")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { automationId } = Route.useParams();
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [stats, setStats] = useState<{ success: number; failed: number; skipped: number; lastRunAt: string | null; lastError: string | null } | null>(null);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);
  const load = async () => {
    const [a, l, s] = await Promise.all([
      fetchAutomation(automationId),
      fetchLogs({ automationId, limit: 20 }),
      fetchAutomationStats(automationId),
    ]);
    setAutomation(a); setLogs(l); setStats(s);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin, automationId]);

  if (!isAdmin || !automation) return null;

  const onDelete = async () => {
    if (!confirm(`Delete "${automation.name}"?`)) return;
    try {
      await deleteAutomation(automation.id);
      toast.success("Deleted");
      navigate({ to: "/admin/automations" });
    } catch (e: any) { toast.error(e?.message ?? "Could not delete"); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link to="/admin/automations"><ArrowLeft className="size-4 mr-1" />All automations</Link>
          </Button>
          <h1 className="text-3xl font-semibold tracking-tight">{automation.name}</h1>
        </div>
        <div className="flex gap-2">
          <TestAutomationModal automation={automation} onLogged={load} />
          <Button variant="outline" asChild><Link to="/admin/automations/$automationId/edit" params={{ automationId: automation.id }}><Pencil className="size-4 mr-1.5" />Edit</Link></Button>
          <Button variant="ghost" onClick={onDelete}><Trash2 className="size-4 mr-1.5" />Delete</Button>
        </div>
      </header>
      <AutomationPreview automation={automation} />
      <AutomationSafetyWarning automation={automation} />
      {stats && <AutomationMetricsCards {...stats} />}
      <AutomationDetailCard automation={automation} />
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent logs</h2>
            <Button variant="ghost" size="sm" asChild><Link to="/admin/automation-logs" search={{ automationId: automation.id } as any}>View all</Link></Button>
          </div>
        </CardHeader>
        <CardContent>
          <AutomationLogsTable rows={logs} automationNames={{ [automation.id]: automation.name }} />
        </CardContent>
      </Card>
    </div>
  );
}
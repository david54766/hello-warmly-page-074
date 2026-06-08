import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchAutomations, fetchLogs, TRIGGER_OPTIONS, type Automation, type AutomationLog, type AutomationLogStatus } from "@/lib/automations";
import { AutomationLogsTable } from "@/components/automations/AutomationLogsTable";

export const Route = createFileRoute("/_authenticated/admin/automation-logs")({
  component: Page,
  validateSearch: (s: Record<string, unknown>) => ({ automationId: (s.automationId as string) ?? "" }),
});

const STATUSES: AutomationLogStatus[] = ["pending", "success", "failed", "skipped"];

function Page() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [automationId, setAutomationId] = useState(search.automationId ?? "");
  const [status, setStatus] = useState<string>("");
  const [triggerType, setTriggerType] = useState<string>("");
  const [since, setSince] = useState<string>("");

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);
  useEffect(() => { if (isAdmin) fetchAutomations().then(setAutomations); }, [isAdmin]);
  useEffect(() => {
    if (!isAdmin) return;
    fetchLogs({
      automationId: automationId || undefined,
      status: (status || undefined) as AutomationLogStatus | undefined,
      triggerType: triggerType || undefined,
      since: since ? new Date(since).toISOString() : undefined,
    }).then(setLogs);
  }, [isAdmin, automationId, status, triggerType, since]);

  const names = useMemo(() => Object.fromEntries(automations.map((a) => [a.id, a.name])), [automations]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Automation logs</h1>
        <p className="text-muted-foreground mt-1">Inspect every automation run, success or failure.</p>
      </header>
      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold">Filters</h2></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="grid gap-1.5">
            <Label>Automation</Label>
            <select className="h-9 border rounded-md px-2 text-sm bg-background" value={automationId} onChange={(e) => setAutomationId(e.target.value)}>
              <option value="">All</option>
              {automations.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <select className="h-9 border rounded-md px-2 text-sm bg-background" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label>Trigger</Label>
            <select className="h-9 border rounded-md px-2 text-sm bg-background" value={triggerType} onChange={(e) => setTriggerType(e.target.value)}>
              <option value="">All</option>
              {TRIGGER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label>Since</Label>
            <Input type="date" value={since} onChange={(e) => setSince(e.target.value)} />
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold">{logs.length} log{logs.length === 1 ? "" : "s"}</h2></CardHeader>
        <CardContent><AutomationLogsTable rows={logs} automationNames={names} /></CardContent>
      </Card>
    </div>
  );
}
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuditLogTable } from "@/components/audit/AuditLogTable";
import { ExportButtonPlaceholder } from "@/components/analytics/ExportButtonPlaceholder";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AUDIT_ACTIONS, type AuditFilters, type AuditTargetType } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/admin/audit-logs")({
  component: AuditLogsPage,
});

const TARGET_TYPES: AuditTargetType[] = ["user","space","post","comment","message","course","lesson","event","plan","coupon","bundle","automation","announcement","segment","access_grant","badge","points","settings","subscription","other"];

function AuditLogsPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<AuditFilters>({});

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [isAdmin, loading, navigate]);
  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Track important admin and moderation actions across the platform.</p>
        </div>
        <ExportButtonPlaceholder kind="audit_logs" />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={filters.action ?? "__all"} onValueChange={(v) => setFilters((f) => ({ ...f, action: v === "__all" ? undefined : v }))}>
          <SelectTrigger><SelectValue placeholder="Action type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All actions</SelectItem>
            {AUDIT_ACTIONS.map((a) => <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.targetType ?? "__all"} onValueChange={(v) => setFilters((f) => ({ ...f, targetType: v === "__all" ? undefined : (v as AuditTargetType) }))}>
          <SelectTrigger><SelectValue placeholder="Target type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All targets</SelectItem>
            {TARGET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={filters.from?.slice(0,10) ?? ""} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} />
        <Input type="date" value={filters.to?.slice(0,10) ?? ""} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} />
      </div>

      <AuditLogTable filters={filters} limit={200} />
    </div>
  );
}
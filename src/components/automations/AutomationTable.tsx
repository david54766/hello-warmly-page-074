import { Link } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, FileText } from "lucide-react";
import { triggerLabel, type Automation } from "@/lib/automations";
import { AutomationStatusToggle } from "./AutomationStatusToggle";

interface Props { rows: Automation[]; onChanged: () => void }

export function AutomationTable({ rows, onChanged }: Props) {
  if (rows.length === 0) return null;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Trigger</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last run</TableHead>
          <TableHead>Runs</TableHead>
          <TableHead>Errors</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((a) => (
          <TableRow key={a.id}>
            <TableCell>
              <Link to="/admin/automations/$automationId" params={{ automationId: a.id }} className="font-medium hover:underline">{a.name}</Link>
              {a.description && <p className="text-xs text-muted-foreground line-clamp-1">{a.description}</p>}
            </TableCell>
            <TableCell className="text-sm">{triggerLabel(a.trigger_type)}</TableCell>
            <TableCell><AutomationStatusToggle automation={a} onChange={onChanged} /></TableCell>
            <TableCell className="text-xs text-muted-foreground">{a.last_run_at ? new Date(a.last_run_at).toLocaleString() : "—"}</TableCell>
            <TableCell>{a.total_runs}</TableCell>
            <TableCell className={a.error_count > 0 ? "text-destructive font-medium" : ""}>{a.error_count}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <div className="flex gap-1 justify-end">
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/admin/automations/$automationId/edit" params={{ automationId: a.id }}><Pencil className="size-3.5" /></Link>
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/admin/automation-logs" search={{ automationId: a.id } as any}><FileText className="size-3.5" /></Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
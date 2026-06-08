import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteSegment, refreshSegment, updateSegment, type Segment } from "@/lib/segments";
import { toast } from "sonner";
import { useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";

export function SegmentTable({ segments, onChange }: { segments: Segment[]; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);

  const handleRefresh = async (id: string) => {
    setBusy(id);
    try {
      const n = await refreshSegment(id);
      toast.success(`Segment refreshed — ${n} member${n === 1 ? "" : "s"} matched`);
      onChange();
    } catch (e: any) {
      toast.error(e?.message ?? "Refresh failed");
    } finally { setBusy(null); }
  };

  const handleToggle = async (s: Segment) => {
    await updateSegment(s.id, { active: !s.active });
    onChange();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this segment?")) return;
    await deleteSegment(id);
    onChange();
  };

  if (!segments.length) return <p className="text-sm text-muted-foreground">No segments yet.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Conditions</TableHead>
          <TableHead>Active</TableHead>
          <TableHead>Last refreshed</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {segments.map((s) => (
          <TableRow key={s.id}>
            <TableCell>
              <Link to="/admin/segments/$segmentId" params={{ segmentId: s.id }} className="font-medium hover:underline">{s.name}</Link>
              {s.description && <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>}
            </TableCell>
            <TableCell className="text-muted-foreground">{s.conditions_json?.length ?? 0} condition(s)</TableCell>
            <TableCell>
              <button onClick={() => handleToggle(s)} className={`text-xs px-2 py-0.5 rounded-full ${s.active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                {s.active ? "Active" : "Inactive"}
              </button>
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">{s.last_refreshed_at ? new Date(s.last_refreshed_at).toLocaleString() : "—"}</TableCell>
            <TableCell className="text-right">
              <div className="inline-flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => handleRefresh(s.id)} disabled={busy === s.id}>
                  <RefreshCw className={`size-3.5 ${busy === s.id ? "animate-spin" : ""}`} />
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/admin/segments/$segmentId/edit" params={{ segmentId: s.id }}>Edit</Link>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)}><Trash2 className="size-3.5" /></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
import { useEffect, useState } from "react";
import { listSegmentMembers, type SegmentMember } from "@/lib/segments";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function SegmentMemberList({ segmentId }: { segmentId: string }) {
  const [rows, setRows] = useState<(SegmentMember & { full_name?: string; email?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const members = await listSegmentMembers(segmentId, 200);
      const ids = members.map((m) => m.user_id);
      let profiles: any[] = [];
      if (ids.length) {
        const { data } = await supabase.from("profiles").select("id,full_name,email").in("id", ids);
        profiles = data ?? [];
      }
      const map = new Map(profiles.map((p) => [p.id, p]));
      setRows(members.map((m) => ({ ...m, full_name: map.get(m.user_id)?.full_name, email: map.get(m.user_id)?.email })));
      setLoading(false);
    })();
  }, [segmentId]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!rows.length) return <p className="text-sm text-muted-foreground">No matching members. Click Refresh segment to recalculate.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Matched at</TableHead></TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">{r.full_name || "—"}</TableCell>
            <TableCell className="text-muted-foreground">{r.email}</TableCell>
            <TableCell className="text-muted-foreground">{new Date(r.matched_at).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
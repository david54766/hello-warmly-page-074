import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { SOURCE_TYPE_LABELS, type AIContentSource } from "@/lib/memberAi";

export function AIContentSourcesTable({
  sources, onToggle, onPreview,
}: { sources: AIContentSource[]; onToggle: (id: string, v: boolean) => void; onPreview: (s: AIContentSource) => void }) {
  if (sources.length === 0) return <div className="py-12 text-center text-sm text-muted-foreground">No content sources.</div>;
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Visibility</TableHead>
          <TableHead>Embedding</TableHead><TableHead>Approved</TableHead><TableHead></TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {sources.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.title}</TableCell>
              <TableCell><Badge variant="outline">{SOURCE_TYPE_LABELS[s.source_type] ?? s.source_type}</Badge></TableCell>
              <TableCell className="text-xs text-muted-foreground">{s.visibility}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{s.embedding_status}</TableCell>
              <TableCell><Switch checked={s.approved_for_member_ai} onCheckedChange={(v) => onToggle(s.id, v)} /></TableCell>
              <TableCell><Button variant="ghost" size="sm" onClick={() => onPreview(s)}><Eye className="size-3" /></Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

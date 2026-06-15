import { Link } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { ResourceTypePill } from "./ResourceTypePill";
import { ResourceAccessPill } from "./ResourceAccessPill";
import type { Resource } from "@/lib/resources";

export function AdminResourceTable({ resources, spacesById, onEdit, onDelete }: {
  resources: Resource[];
  spacesById: Record<string, string>;
  onEdit: (r: Resource) => void;
  onDelete: (r: Resource) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Access</TableHead>
          <TableHead>Space</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {resources.map((r) => (
          <TableRow key={r.id}>
            <TableCell>
              <Link to="/resources/$resourceId" params={{ resourceId: r.id }} className="font-medium hover:underline">{r.title}</Link>
              {r.is_archived && <span className="ml-2 text-[10px] uppercase text-muted-foreground">Archived</span>}
            </TableCell>
            <TableCell><ResourceTypePill type={r.resource_type} /></TableCell>
            <TableCell><ResourceAccessPill level={r.access_level} /></TableCell>
            <TableCell className="text-sm text-muted-foreground">{r.space_id ? spacesById[r.space_id] ?? "—" : "Global"}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="ghost" onClick={() => onEdit(r)}><Pencil className="size-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(r)}><Trash2 className="size-4 text-destructive" /></Button>
            </TableCell>
          </TableRow>
        ))}
        {resources.length === 0 && (
          <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No resources found.</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );
}
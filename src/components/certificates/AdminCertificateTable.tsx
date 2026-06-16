import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteCertificate, updateCertificate, type Certificate } from "@/lib/certificates";
import { Pencil, Trash2 } from "lucide-react";

export function AdminCertificateTable({ items, onEdit, onChange }: { items: (Certificate & { course_title?: string })[]; onEdit: (c: Certificate) => void; onChange: () => void }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No certificates yet.</p>;
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.title}</TableCell>
              <TableCell>{c.course_title ?? <Badge variant="outline">Course</Badge>}</TableCell>
              <TableCell>
                <Switch checked={c.active} onCheckedChange={async (v) => { await updateCertificate(c.id, { active: v }); onChange(); }} />
              </TableCell>
              <TableCell className="text-right space-x-1">
                <Button size="sm" variant="ghost" onClick={() => onEdit(c)}><Pencil className="size-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={async () => { await deleteCertificate(c.id); toast.success("Deleted"); onChange(); }}>
                  <Trash2 className="size-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildInviteUrl, deleteInviteLink, updateInviteLink, type InviteLink } from "@/lib/invitations";
import { Copy, Trash2 } from "lucide-react";

export function InviteLinkTable({ items, onChange }: { items: InviteLink[]; onChange: () => void }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No invite links yet.</p>;
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Uses</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="font-medium">{l.name}</TableCell>
              <TableCell className="capitalize">{l.role.replace("_", " ")}</TableCell>
              <TableCell>{l.uses_count}{l.max_uses ? ` / ${l.max_uses}` : ""}</TableCell>
              <TableCell>{l.expires_at ? new Date(l.expires_at).toLocaleDateString() : "—"}</TableCell>
              <TableCell>
                <Switch checked={l.active} onCheckedChange={async (v) => { await updateInviteLink(l.id, { active: v }); onChange(); }} />
              </TableCell>
              <TableCell className="text-right space-x-1">
                <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(buildInviteUrl(l.token)); toast.success("Link copied"); }}>
                  <Copy className="size-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={async () => { await deleteInviteLink(l.id); toast.success("Deleted"); onChange(); }}>
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
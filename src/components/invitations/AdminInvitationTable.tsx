import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildInviteUrl, cancelInvitation, type Invitation } from "@/lib/invitations";
import { Copy, X, Send } from "lucide-react";

const statusVariant: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  accepted: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  expired: "bg-muted text-muted-foreground",
  canceled: "bg-muted text-muted-foreground",
};

export function AdminInvitationTable({ items, onChange }: { items: Invitation[]; onChange: () => void }) {
  async function copy(token: string) {
    await navigator.clipboard.writeText(buildInviteUrl(token));
    toast.success("Invite link copied");
  }
  async function cancel(id: string) {
    await cancelInvitation(id);
    toast.success("Invitation canceled");
    onChange();
  }

  if (items.length === 0) return <p className="text-sm text-muted-foreground">No invitations yet.</p>;
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((i) => (
            <TableRow key={i.id}>
              <TableCell className="font-medium">{i.email}</TableCell>
              <TableCell className="capitalize">{i.role.replace("_", " ")}</TableCell>
              <TableCell><Badge className={statusVariant[i.status]}>{i.status}</Badge></TableCell>
              <TableCell>{i.expires_at ? new Date(i.expires_at).toLocaleDateString() : "—"}</TableCell>
              <TableCell className="text-right space-x-1">
                <Button size="sm" variant="ghost" onClick={() => copy(i.token)}><Copy className="size-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => toast.info("Resend coming soon")}><Send className="size-3.5" /></Button>
                {i.status === "pending" && <Button size="sm" variant="ghost" onClick={() => cancel(i.id)}><X className="size-3.5" /></Button>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
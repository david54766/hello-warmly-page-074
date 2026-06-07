import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { highestRole, memberInitials, relativeTime, type MemberSummary } from "@/lib/members";
import { RolePill } from "./RolePill";
import { StatusPill } from "./StatusPill";

export function AdminMemberTable({ members }: { members: MemberSummary[] }) {
  return (
    <div className="rounded-2xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Spaces</TableHead>
            <TableHead className="hidden md:table-cell">Last active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarImage src={m.avatar_url || undefined} />
                    <AvatarFallback>{memberInitials(m.full_name, m.email)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.full_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell><RolePill role={highestRole(m.roles)} /></TableCell>
              <TableCell><StatusPill status={m.status} /></TableCell>
              <TableCell className="hidden md:table-cell">{m.spaces_joined}</TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{relativeTime(m.last_active_at)}</TableCell>
              <TableCell className="text-right">
                <Button asChild size="sm" variant="outline">
                  <Link to="/admin/members/$userId" params={{ userId: m.id }}>Manage</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
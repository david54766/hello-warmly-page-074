import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Collection, Space, SpaceMemberRole } from "@/lib/spaces";
import { getIcon } from "@/lib/spaces";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminSpaceForm } from "@/components/app/AdminSpaceForm";
import { PrivacyPill } from "@/components/app/PrivacyPill";
import { AccessPill } from "@/components/app/AccessPill";
import { EmptyState } from "@/components/app/DashboardCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pencil, Archive, ArchiveRestore, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/spaces/$spaceId")({
  component: AdminSpaceDetail,
});

interface MemberRow {
  id: string;
  user_id: string;
  role: SpaceMemberRole;
  joined_at: string;
  profile: { full_name: string | null; email: string | null; avatar_url: string | null } | null;
}

function AdminSpaceDetail() {
  const { spaceId } = Route.useParams();
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [space, setSpace] = useState<Space | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [open, setOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => { if (!authLoading && !isAdmin) navigate({ to: "/dashboard" }); }, [authLoading, isAdmin, navigate]);

  const load = async () => {
    setLoading(true);
    const [{ data: sp }, { data: cols }] = await Promise.all([
      supabase.from("spaces").select("*").eq("id", spaceId).maybeSingle(),
      supabase.from("collections").select("*").order("sort_order"),
    ]);
    setSpace((sp as Space) ?? null);
    setCollections((cols ?? []) as Collection[]);
    setCollection(((cols ?? []) as Collection[]).find((c) => c.id === sp?.collection_id) ?? null);

    const { data: rows } = await supabase
      .from("space_members")
      .select("id,user_id,role,joined_at")
      .eq("space_id", spaceId)
      .order("joined_at", { ascending: false });
    const ids = (rows ?? []).map((r) => r.user_id);
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("id,full_name,email,avatar_url").in("id", ids)
      : { data: [] as { id: string; full_name: string | null; email: string | null; avatar_url: string | null }[] };
    const pmap = new Map((profs ?? []).map((p) => [p.id, p]));
    setMembers((rows ?? []).map((r) => ({
      id: r.id,
      user_id: r.user_id,
      role: r.role as SpaceMemberRole,
      joined_at: r.joined_at,
      profile: pmap.get(r.user_id) ?? null,
    })));
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, spaceId]);

  const addMember = async () => {
    if (!addEmail.trim()) return;
    setAdding(true);
    const { data: prof } = await supabase.from("profiles").select("id").eq("email", addEmail.trim()).maybeSingle();
    if (!prof) { setAdding(false); return toast.error("No member with that email"); }
    const { error } = await supabase.from("space_members").insert({ space_id: spaceId, user_id: prof.id, role: "member" });
    setAdding(false);
    if (error) return toast.error(error.message);
    setAddEmail("");
    toast.success("Member added");
    load();
  };

  const removeMember = async (m: MemberRow) => {
    if (!confirm(`Remove ${m.profile?.full_name || m.profile?.email || "member"}?`)) return;
    const { error } = await supabase.from("space_members").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Member removed");
    load();
  };

  const changeRole = async (m: MemberRow, role: SpaceMemberRole) => {
    const { error } = await supabase.from("space_members").update({ role }).eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Role updated");
    load();
  };

  const toggleArchive = async () => {
    if (!space) return;
    const { error } = await supabase.from("spaces").update({ is_archived: !space.is_archived }).eq("id", space.id);
    if (error) return toast.error(error.message);
    toast.success(space.is_archived ? "Restored" : "Archived");
    load();
  };

  if (!isAdmin) return null;
  if (loading) return <div className="space-y-4"><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>;
  if (!space) return <EmptyState title="Space not found" />;

  const Icon = getIcon(space.icon);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild><Link to="/admin/spaces"><ArrowLeft className="size-4 mr-1" />All Spaces</Link></Button>
      </div>
      <Card className="rounded-2xl">
        <CardContent className="pt-5 flex flex-wrap items-center gap-4">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center">
            <Icon className="size-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{space.name}</h1>
              <PrivacyPill level={space.privacy_level} />
              <AccessPill level={space.access_level} />
            </div>
            {space.tagline && <p className="text-muted-foreground text-sm mt-0.5">{space.tagline}</p>}
            <p className="text-xs text-muted-foreground mt-1">{collection?.name ?? "Uncategorized"} · {members.length} member{members.length === 1 ? "" : "s"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(true)}><Pencil className="size-4 mr-1.5" />Edit</Button>
            <Button variant="outline" onClick={toggleArchive}>
              {space.is_archived ? <><ArchiveRestore className="size-4 mr-1.5" />Restore</> : <><Archive className="size-4 mr-1.5" />Archive</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="size-4" />Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="member@example.com"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMember()}
            />
            <Button onClick={addMember} disabled={adding}>
              <UserPlus className="size-4 mr-1.5" />Add
            </Button>
          </div>
          {members.length === 0 ? (
            <EmptyState icon={<Users className="size-5" />} title="No members yet" />
          ) : (
            <ul className="divide-y divide-border">
              {members.map((m) => {
                const name = m.profile?.full_name || m.profile?.email || "Member";
                const initials = name.slice(0, 2).toUpperCase();
                return (
                  <li key={m.id} className="flex items-center gap-3 py-3">
                    <Avatar className="size-9">
                      {m.profile?.avatar_url && <AvatarImage src={m.profile.avatar_url} alt="" />}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">{m.profile?.email}</p>
                    </div>
                    <Select value={m.role} onValueChange={(v) => changeRole(m, v as SpaceMemberRole)}>
                      <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="space_moderator">Moderator</SelectItem>
                        <SelectItem value="space_host">Host</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => removeMember(m)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <AdminSpaceForm
        key={space.id}
        open={open}
        onOpenChange={setOpen}
        initial={space}
        collections={collections}
        onSaved={load}
      />
    </div>
  );
}
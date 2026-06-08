import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ACCESS_SOURCE_LABELS, fetchAllGrants, revokeGrant, type AccessGrant } from "@/lib/access";
import { TARGET_TYPE_LABELS } from "@/lib/plans";
import { ManualAccessGrantModal } from "./ManualAccessGrantModal";
import { Search, UserPlus, Filter } from "lucide-react";
import { toast } from "sonner";

const db = supabase as any;

interface MemberRow { id: string; full_name: string | null; email: string | null; }

export function AdminAccessTable() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [grantingUserId, setGrantingUserId] = useState<string | null>(null);

  const load = async () => {
    const [{ data: profs }, g] = await Promise.all([
      db.from("profiles").select("id, full_name, email").order("full_name").limit(500),
      fetchAllGrants(),
    ]);
    setMembers((profs ?? []) as MemberRow[]);
    setGrants(g);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (q && !(`${m.full_name ?? ""} ${m.email ?? ""}`.toLowerCase().includes(q))) return false;
      const userGrants = grants.filter((g) => g.user_id === m.id && (showInactive || g.active));
      if (filterType !== "all" && !userGrants.some((g) => g.target_type === filterType)) return false;
      if (q || filterType !== "all") return userGrants.length > 0 || q.length > 0;
      return userGrants.length > 0; // show only members with grants by default
    });
  }, [members, grants, search, filterType, showInactive]);

  const handleRevoke = async (id: string) => {
    try { await revokeGrant(id); toast.success("Grant revoked"); load(); }
    catch (e: any) { toast.error(e?.message ?? "Could not revoke"); }
  };

  return (
    <>
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search members…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="border rounded-md px-3 text-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All targets</option>
              {Object.entries(TARGET_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <Button variant="outline" size="sm" onClick={() => setShowInactive((s) => !s)}>
              <Filter className="size-4 mr-1.5" />{showInactive ? "Active only" : "Show inactive"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">No members match. Use search to find a member and grant access.</p>
          )}
          {filtered.map((m) => {
            const userGrants = grants.filter((g) => g.user_id === m.id && (showInactive || g.active));
            return (
              <div key={m.id} className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.full_name ?? "Unnamed member"}</p>
                    {m.email && <p className="text-xs text-muted-foreground truncate">{m.email}</p>}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setGrantingUserId(m.id)}>
                    <UserPlus className="size-4 mr-1.5" />Grant
                  </Button>
                </div>
                {userGrants.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {userGrants.map((g) => (
                      <li key={g.id} className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="outline">{TARGET_TYPE_LABELS[g.target_type]}</Badge>
                        <Badge variant="secondary" className="rounded-full">{ACCESS_SOURCE_LABELS[g.access_source]}</Badge>
                        {!g.active && <Badge variant="destructive" className="rounded-full">Inactive</Badge>}
                        {g.ends_at && <span className="text-xs text-muted-foreground">Expires {new Date(g.ends_at).toLocaleDateString()}</span>}
                        <span className="flex-1" />
                        {g.active && <Button size="sm" variant="ghost" onClick={() => handleRevoke(g.id)}>Revoke</Button>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">No grants yet.</p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
      {grantingUserId && (
        <ManualAccessGrantModal
          open={!!grantingUserId}
          onOpenChange={(v) => !v && setGrantingUserId(null)}
          userId={grantingUserId}
          onSaved={load}
        />
      )}
    </>
  );
}
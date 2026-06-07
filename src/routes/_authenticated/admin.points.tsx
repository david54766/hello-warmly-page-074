import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { fetchAllPointsLedger, type PointsEntry, type PointsSourceType, SOURCE_LABELS } from "@/lib/gamification";
import { PointsLedgerTable } from "@/components/gamification/PointsLedgerTable";
import { AwardPointsModal } from "@/components/gamification/AwardPointsModal";
import { fetchMembers, type MemberSummary } from "@/lib/members";

export const Route = createFileRoute("/_authenticated/admin/points")({ component: AdminPointsPage });

const SOURCES: PointsSourceType[] = ["profile_complete","space_joined","post_created","comment_created","reaction_received","event_rsvp","course_started","lesson_completed","checklist_completed","follow_member","manual","badge_awarded"];

function AdminPointsPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<PointsEntry[]>([]);
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<PointsSourceType | "all">("all");
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);
  const reload = async () => setRows(await fetchAllPointsLedger({ sourceType: source === "all" ? null : source, limit: 200 }));
  useEffect(() => { if (isAdmin) reload(); }, [isAdmin, source]);
  useEffect(() => { if (isAdmin) fetchMembers().then(setMembers); }, [isAdmin]);

  const names = useMemo(() => {
    const m = new Map<string, string>();
    members.forEach((mm) => m.set(mm.id, mm.full_name || mm.email || mm.id.slice(0, 8)));
    return m;
  }, [members]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (names.get(r.user_id) ?? "").toLowerCase().includes(q));
  }, [rows, search, names]);

  if (!isAdmin) return null;
  const total = filtered.reduce((s, r) => s + r.points, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Points activity</h1>
          <p className="text-muted-foreground mt-1">Review every points event and manually adjust balances.</p>
        </div>
        <Button onClick={() => setAdjusting(true)}><Sparkles className="size-4 mr-1.5" />Adjust points</Button>
      </header>

      <Card className="rounded-2xl">
        <CardContent className="pt-5 flex flex-wrap items-center gap-3">
          <Input placeholder="Search member" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <Select value={source} onValueChange={(v) => setSource(v as any)}>
            <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {SOURCES.map((s) => <SelectItem key={s} value={s}>{SOURCE_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="ml-auto text-sm text-muted-foreground">Sum: <span className="font-medium text-foreground">{total.toLocaleString()}</span></div>
        </CardContent>
      </Card>

      <PointsLedgerTable rows={filtered} showUser userNames={names} />
      <AwardPointsModal open={adjusting} onOpenChange={setAdjusting} onDone={reload} />
    </div>
  );
}
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSegment, refreshSegment, segmentMemberCount, type Segment } from "@/lib/segments";
import { SegmentMemberList } from "@/components/segments/SegmentMemberList";
import { SegmentPreview } from "@/components/segments/SegmentPreview";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/segments/$segmentId")({ component: Page });

function Page() {
  const { segmentId } = Route.useParams();
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [s, setS] = useState<Segment | null>(null);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const load = async () => { setS(await getSegment(segmentId)); setCount(await segmentMemberCount(segmentId)); };
  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/dashboard" }); }, [isAdmin, loading, nav]);
  useEffect(() => { if (isAdmin) load(); }, [isAdmin, segmentId]);
  if (!isAdmin || !s) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{s.name}</h1>
          {s.description && <p className="text-muted-foreground mt-1">{s.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={busy} onClick={async () => { setBusy(true); try { const n = await refreshSegment(s.id); toast.success(`${n} matched`); await load(); } catch (e: any) { toast.error(e.message); } finally { setBusy(false); } }}>
            <RefreshCw className={`size-4 mr-1.5 ${busy ? "animate-spin" : ""}`} />Refresh segment
          </Button>
          <Button asChild><Link to="/admin/segments/$segmentId/edit" params={{ segmentId: s.id }}>Edit</Link></Button>
        </div>
      </div>
      <SegmentPreview conditions={s.conditions_json} matchMode={s.match_mode} />
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Members ({count})</CardTitle></CardHeader>
        <CardContent><SegmentMemberList segmentId={s.id} /></CardContent>
      </Card>
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="rounded-2xl"><CardHeader><CardTitle>Used in announcements</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Placeholder — reference list coming soon.</p></CardContent></Card>
        <Card className="rounded-2xl"><CardHeader><CardTitle>Used in automations</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Placeholder — reference list coming soon.</p></CardContent></Card>
      </div>
    </div>
  );
}
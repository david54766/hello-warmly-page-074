import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getSegment, updateSegment, type Segment } from "@/lib/segments";
import { SegmentBuilder } from "@/components/segments/SegmentBuilder";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/segments/$segmentId/edit")({ component: Page });

function Page() {
  const { segmentId } = Route.useParams();
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [s, setS] = useState<Segment | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/dashboard" }); }, [isAdmin, loading, nav]);
  useEffect(() => { if (isAdmin) getSegment(segmentId).then(setS); }, [isAdmin, segmentId]);
  if (!isAdmin || !s) return null;
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">Edit segment</h1>
      <SegmentBuilder initial={s} saving={saving} onSubmit={async (v) => {
        setSaving(true);
        try { await updateSegment(s.id, v); toast.success("Saved"); nav({ to: "/admin/segments/$segmentId", params: { segmentId: s.id } }); }
        catch (e: any) { toast.error(e?.message ?? "Failed"); }
        finally { setSaving(false); }
      }} />
    </div>
  );
}
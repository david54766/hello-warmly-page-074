import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SegmentBuilder } from "@/components/segments/SegmentBuilder";
import { createSegment } from "@/lib/segments";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/segments/new")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/dashboard" }); }, [isAdmin, loading, nav]);
  if (!isAdmin) return null;
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">New segment</h1>
      <SegmentBuilder saving={saving} onSubmit={async (v) => {
        setSaving(true);
        try { const s = await createSegment(v); toast.success("Segment created"); nav({ to: "/admin/segments/$segmentId", params: { segmentId: s.id } }); }
        catch (e: any) { toast.error(e?.message ?? "Failed"); }
        finally { setSaving(false); }
      }} />
    </div>
  );
}
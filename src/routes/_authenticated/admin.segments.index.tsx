import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { listSegments, type Segment } from "@/lib/segments";
import { SegmentTable } from "@/components/segments/SegmentTable";

export const Route = createFileRoute("/_authenticated/admin/segments/")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Segment[]>([]);
  const refresh = () => listSegments().then(setRows);
  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/dashboard" }); }, [isAdmin, loading, nav]);
  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);
  if (!isAdmin) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Member Segments</h1>
          <p className="text-muted-foreground mt-1">Group members by activity, access, progress, and engagement so you can target the right people at the right time.</p>
        </div>
        <Button asChild><Link to="/admin/segments/new"><Plus className="size-4 mr-1.5" />New segment</Link></Button>
      </div>
      <SegmentTable segments={rows} onChange={refresh} />
    </div>
  );
}
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { listAnnouncementsAdmin, type AdminAnnouncement } from "@/lib/announcements";
import { AnnouncementTable } from "@/components/announcements/AnnouncementTable";

export const Route = createFileRoute("/_authenticated/admin/announcements/")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<AdminAnnouncement[]>([]);
  const refresh = () => listAnnouncementsAdmin().then(setRows);
  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/dashboard" }); }, [isAdmin, loading, nav]);
  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);
  if (!isAdmin) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground mt-1">Send important updates to the whole platform, a Space, a plan, or a member segment.</p>
        </div>
        <Button asChild><Link to="/admin/announcements/new"><Plus className="size-4 mr-1.5" />New announcement</Link></Button>
      </div>
      <AnnouncementTable rows={rows} onChange={refresh} />
    </div>
  );
}
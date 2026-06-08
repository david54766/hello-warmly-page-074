import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getAnnouncement, sendAnnouncement, archiveAnnouncement, type AdminAnnouncement } from "@/lib/announcements";
import { AnnouncementDetail } from "@/components/announcements/AnnouncementDetail";
import { AnnouncementStatusPill } from "@/components/announcements/AnnouncementStatusPill";
import { AnnouncementViewStats } from "@/components/announcements/AnnouncementViewStats";
import { toast } from "sonner";
import { Send, Archive } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/announcements/$announcementId")({ component: Page });

function Page() {
  const { announcementId } = Route.useParams();
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [a, setA] = useState<AdminAnnouncement | null>(null);
  const load = () => getAnnouncement(announcementId).then(setA);
  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/dashboard" }); }, [isAdmin, loading, nav]);
  useEffect(() => { if (isAdmin) load(); }, [isAdmin, announcementId]);
  if (!isAdmin || !a) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight">{a.title}</h1><AnnouncementStatusPill status={a.status} /></div>
        <div className="flex gap-2">
          {a.status !== "sent" && a.status !== "archived" && (
            <Button onClick={async () => { try { const n = await sendAnnouncement(a.id); toast.success(`Sent — ${n} notified`); load(); } catch (e: any) { toast.error(e.message); } }}><Send className="size-4 mr-1.5" />Send now</Button>
          )}
          <Button variant="outline" asChild><Link to="/admin/announcements/$announcementId/edit" params={{ announcementId: a.id }}>Edit</Link></Button>
          {a.status !== "archived" && <Button variant="ghost" onClick={() => archiveAnnouncement(a.id).then(load)}><Archive className="size-4 mr-1.5" />Archive</Button>}
        </div>
      </div>
      <AnnouncementDetail a={a} showTarget />
      <AnnouncementViewStats announcementId={a.id} />
    </div>
  );
}
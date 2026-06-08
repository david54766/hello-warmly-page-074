import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AnnouncementForm } from "@/components/announcements/AnnouncementForm";
import { getAnnouncement, updateAnnouncement, type AdminAnnouncement } from "@/lib/announcements";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/announcements/$announcementId/edit")({ component: Page });

function Page() {
  const { announcementId } = Route.useParams();
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [a, setA] = useState<AdminAnnouncement | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/dashboard" }); }, [isAdmin, loading, nav]);
  useEffect(() => { if (isAdmin) getAnnouncement(announcementId).then(setA); }, [isAdmin, announcementId]);
  if (!isAdmin || !a) return null;
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">Edit announcement</h1>
      <AnnouncementForm initial={a} saving={saving} onSubmit={async (v) => {
        setSaving(true);
        try { await updateAnnouncement(a.id, v); toast.success("Saved"); nav({ to: "/admin/announcements/$announcementId", params: { announcementId: a.id } }); }
        catch (e: any) { toast.error(e?.message ?? "Failed"); }
        finally { setSaving(false); }
      }} />
    </div>
  );
}
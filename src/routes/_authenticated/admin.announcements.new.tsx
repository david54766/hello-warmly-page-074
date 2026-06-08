import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AnnouncementForm } from "@/components/announcements/AnnouncementForm";
import { createAnnouncement } from "@/lib/announcements";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/announcements/new")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/dashboard" }); }, [isAdmin, loading, nav]);
  if (!isAdmin) return null;
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">New announcement</h1>
      <AnnouncementForm saving={saving} onSubmit={async (v) => {
        setSaving(true);
        try { const a = await createAnnouncement(v); toast.success("Draft saved"); nav({ to: "/admin/announcements/$announcementId", params: { announcementId: a.id } }); }
        catch (e: any) { toast.error(e?.message ?? "Failed"); }
        finally { setSaving(false); }
      }} />
    </div>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getAnnouncement, recordView, type AdminAnnouncement } from "@/lib/announcements";
import { AnnouncementDetail } from "@/components/announcements/AnnouncementDetail";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/announcements/$announcementId")({ component: Page });

function Page() {
  const { announcementId } = Route.useParams();
  const { isAdmin } = useAuth();
  const [a, setA] = useState<AdminAnnouncement | null>(null);
  useEffect(() => { getAnnouncement(announcementId).then(setA); recordView(announcementId, false); }, [announcementId]);
  if (!a) return null;
  return (
    <div className="space-y-4 max-w-3xl">
      <Button variant="ghost" size="sm" asChild><Link to="/dashboard"><ArrowLeft className="size-4 mr-1" />Back</Link></Button>
      <AnnouncementDetail a={a} showTarget={isAdmin} />
    </div>
  );
}
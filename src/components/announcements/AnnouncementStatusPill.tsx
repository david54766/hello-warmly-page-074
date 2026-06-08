import type { AnnouncementStatus } from "@/lib/announcements";
import { cn } from "@/lib/utils";

const styles: Record<AnnouncementStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-amber-500/10 text-amber-600",
  sent: "bg-emerald-500/10 text-emerald-600",
  archived: "bg-slate-500/10 text-slate-600",
};

export function AnnouncementStatusPill({ status }: { status: AnnouncementStatus }) {
  return <span className={cn("text-xs px-2 py-0.5 rounded-full capitalize", styles[status])}>{status}</span>;
}
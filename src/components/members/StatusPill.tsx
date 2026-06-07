import { cn } from "@/lib/utils";
import { STATUS_LABELS, type MemberStatus } from "@/lib/members";

const TONE: Record<MemberStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  inactive: "bg-muted text-muted-foreground border-border",
  suspended: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  removed: "bg-destructive/10 text-destructive border-destructive/20",
};

export function StatusPill({ status, className }: { status: MemberStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", TONE[status], className)}>
      {STATUS_LABELS[status]}
    </span>
  );
}
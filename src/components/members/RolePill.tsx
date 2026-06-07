import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/members";
import type { AppRole } from "@/hooks/useAuth";

const TONE: Record<AppRole, string> = {
  platform_admin: "bg-primary/10 text-primary border-primary/20",
  moderator: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  space_host: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
  member: "bg-muted text-muted-foreground border-border",
  limited_member: "bg-muted text-muted-foreground border-border",
};

export function RolePill({ role, className }: { role: AppRole; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", TONE[role], className)}>
      {ROLE_LABELS[role]}
    </span>
  );
}
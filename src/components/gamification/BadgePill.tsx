import { Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Badge } from "@/lib/gamification";

const TYPE_TONE: Record<string, string> = {
  manual: "bg-muted text-foreground",
  milestone: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  course: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  event: "bg-purple-500/10 text-purple-600 dark:text-purple-300",
  community: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  special: "bg-gradient-to-r from-amber-500/15 to-pink-500/15 text-amber-700 dark:text-amber-200",
};

export function BadgePill({ badge, size = "sm", className }: { badge: Pick<Badge, "name" | "badge_type" | "icon_url">; size?: "sm" | "md"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium border border-border/50",
        TYPE_TONE[badge.badge_type] ?? TYPE_TONE.manual,
        size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        className,
      )}
      title={badge.name}
    >
      {badge.icon_url ? (
        <img src={badge.icon_url} alt="" className={cn("rounded-full object-cover", size === "sm" ? "size-3.5" : "size-4")} />
      ) : (
        <Award className={cn(size === "sm" ? "size-3" : "size-3.5")} />
      )}
      <span className="truncate max-w-[140px]">{badge.name}</span>
    </span>
  );
}

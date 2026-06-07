import { Sparkles, Eye, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCESS_LABELS, type SpaceAccess } from "@/lib/spaces";

const ICONS = { free: Sparkles, preview: Eye, paid_placeholder: Lock } as const;
const TONES: Record<SpaceAccess, string> = {
  free: "bg-muted text-muted-foreground",
  preview: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  paid_placeholder: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
};

export function AccessPill({ level, className }: { level: SpaceAccess; className?: string }) {
  const Icon = ICONS[level];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5", TONES[level], className)}>
      <Icon className="size-3" />
      {ACCESS_LABELS[level]}
    </span>
  );
}
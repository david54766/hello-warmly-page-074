import { Globe, Users2, Lock, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIVACY_LABELS, type SpacePrivacy } from "@/lib/spaces";

const ICONS = {
  public: Globe,
  members_only: Users2,
  private: Lock,
  hidden: EyeOff,
} as const;

const TONES: Record<SpacePrivacy, string> = {
  public: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  members_only: "bg-primary/10 text-primary",
  private: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  hidden: "bg-muted text-muted-foreground",
};

export function PrivacyPill({ level, className }: { level: SpacePrivacy; className?: string }) {
  const Icon = ICONS[level];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5", TONES[level], className)}>
      <Icon className="size-3" />
      {PRIVACY_LABELS[level]}
    </span>
  );
}
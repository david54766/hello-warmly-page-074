import { SEVERITY_TONE, type FlagSeverity } from "@/lib/moderation";
import { cn } from "@/lib/utils";

export function SeverityPill({ severity }: { severity: FlagSeverity }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide", SEVERITY_TONE[severity])}>
      {severity}
    </span>
  );
}
import { WARNING_TONE, type WarningStatus } from "@/lib/moderation";
import { cn } from "@/lib/utils";

export function WarningStatusPill({ status }: { status: WarningStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize", WARNING_TONE[status])}>
      {status}
    </span>
  );
}
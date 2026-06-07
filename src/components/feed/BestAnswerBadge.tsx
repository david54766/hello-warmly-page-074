import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function BestAnswerBadge({
  className,
  label = "Best answer",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5",
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
        className,
      )}
    >
      <CheckCircle2 className="size-3" />
      {label}
    </span>
  );
}

export function AnsweredBadge({ className }: { className?: string }) {
  return <BestAnswerBadge className={className} label="Answered" />;
}
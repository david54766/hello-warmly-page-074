import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function PointsDisplay({ points, size = "md", className }: { points: number; size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  const map = {
    xs: "text-[11px] gap-1 px-1.5 py-0.5",
    sm: "text-xs gap-1 px-2 py-0.5",
    md: "text-sm gap-1.5 px-2.5 py-1",
    lg: "text-base gap-2 px-3 py-1.5",
  } as const;
  const iconSize = size === "lg" ? "size-4" : size === "md" ? "size-3.5" : "size-3";
  return (
    <span className={cn("inline-flex items-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium", map[size], className)}>
      <Sparkles className={iconSize} />
      {points.toLocaleString()} pts
    </span>
  );
}
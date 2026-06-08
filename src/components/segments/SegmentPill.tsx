import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

export function SegmentPill({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium", className)}>
      <Users className="size-3" /> {name}
    </span>
  );
}
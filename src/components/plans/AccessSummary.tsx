import { ACCESS_LEVEL_LABELS, TARGET_TYPE_LABELS, type PlanItem } from "@/lib/plans";
import { Badge } from "@/components/ui/badge";
import { Globe, Users2, GraduationCap, Calendar, BookOpen } from "lucide-react";

const ICONS = {
  platform: Globe,
  space: Users2,
  course: GraduationCap,
  event: Calendar,
  resource_placeholder: BookOpen,
} as const;

export function AccessSummary({ items, nameLookup }: { items: PlanItem[]; nameLookup?: Record<string, string> }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No access rules defined yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((it) => {
        const Icon = ICONS[it.target_type];
        const name = it.target_id ? nameLookup?.[it.target_id] ?? `#${it.target_id.slice(0, 6)}` : TARGET_TYPE_LABELS[it.target_type];
        return (
          <li key={it.id} className="flex items-center gap-2 text-sm">
            <Icon className="size-4 text-muted-foreground shrink-0" />
            <span className="flex-1 truncate">{name}</span>
            <Badge variant="secondary" className="text-xs">{ACCESS_LEVEL_LABELS[it.access_level]}</Badge>
          </li>
        );
      })}
    </ul>
  );
}
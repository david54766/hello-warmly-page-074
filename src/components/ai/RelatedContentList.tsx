import { SOURCE_TYPE_LABELS, type AIContentSourceType } from "@/lib/memberAi";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

export function RelatedContentList({ items }: { items: { id: string; title: string; source_type: AIContentSourceType }[] }) {
  if (!items?.length) {
    return <div className="text-xs text-muted-foreground">No related content found.</div>;
  }
  return (
    <div className="rounded-md border bg-muted/30 p-2 space-y-1">
      <div className="text-[11px] font-medium uppercase text-muted-foreground flex items-center gap-1">
        <BookOpen className="size-3" /> Related
      </div>
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="text-[10px]">{SOURCE_TYPE_LABELS[it.source_type] ?? it.source_type}</Badge>
          <span className="truncate">{it.title}</span>
        </div>
      ))}
    </div>
  );
}

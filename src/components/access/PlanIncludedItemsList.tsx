import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { TARGET_TYPE_LABELS, type PlanItem } from "@/lib/plans";

const db = supabase as any;

export function PlanIncludedItemsList({ items }: { items: PlanItem[] }) {
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const updates: Record<string, string> = {};
      for (const it of items) {
        if (it.target_type === "platform" || !it.target_id) continue;
        const table = it.target_type === "space" ? "spaces" : it.target_type === "course" ? "courses" : it.target_type === "event" ? "events" : null;
        if (!table) continue;
        const col = it.target_type === "space" ? "name" : "title";
        const { data } = await db.from(table).select(`id, ${col}`).eq("id", it.target_id).maybeSingle();
        if (data) updates[it.id] = data[col] ?? "Untitled";
      }
      setNames(updates);
    })();
  }, [items]);

  if (items.length === 0) return <p className="text-sm text-muted-foreground">No items included yet.</p>;

  return (
    <ul className="space-y-1.5">
      {items.map((it) => (
        <li key={it.id} className="flex items-center gap-2 text-sm">
          <Badge variant="outline">{TARGET_TYPE_LABELS[it.target_type]}</Badge>
          <span className="truncate">{it.target_type === "platform" ? "Entire platform" : names[it.id] ?? "—"}</span>
        </li>
      ))}
    </ul>
  );
}
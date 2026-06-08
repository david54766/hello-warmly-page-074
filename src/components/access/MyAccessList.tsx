import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ACCESS_SOURCE_LABELS, type AccessGrant } from "@/lib/access";
import { TARGET_TYPE_LABELS } from "@/lib/plans";

const db = supabase as any;

interface NamedItem { id: string; name: string; type: AccessGrant["target_type"]; source: string; }

export function MyAccessList({ grants }: { grants: AccessGrant[] }) {
  const [resolved, setResolved] = useState<NamedItem[]>([]);

  useEffect(() => {
    (async () => {
      const items: NamedItem[] = [];
      for (const g of grants.filter((x) => x.active)) {
        if (g.target_type === "platform") {
          items.push({ id: "platform", name: "Entire platform", type: "platform", source: ACCESS_SOURCE_LABELS[g.access_source] });
          continue;
        }
        if (!g.target_id) continue;
        const table = g.target_type === "space" ? "spaces" : g.target_type === "course" ? "courses" : g.target_type === "event" ? "events" : null;
        if (!table) continue;
        const col = g.target_type === "course" || g.target_type === "event" ? "title" : "name";
        const { data } = await db.from(table).select(`id, ${col}`).eq("id", g.target_id).maybeSingle();
        if (data) items.push({ id: data.id, name: data[col] ?? "Untitled", type: g.target_type, source: ACCESS_SOURCE_LABELS[g.access_source] });
      }
      setResolved(items);
    })();
  }, [grants]);

  if (resolved.length === 0) {
    return <p className="text-sm text-muted-foreground">No premium grants yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {resolved.map((it) => {
        const to =
          it.type === "space" ? `/spaces/${it.id}` :
          it.type === "course" ? `/courses/${it.id}` :
          it.type === "event" ? `/events/${it.id}` : null;
        return (
          <li key={`${it.type}-${it.id}`}>
            <Card className="rounded-xl">
              <CardContent className="pt-4 flex items-center gap-3">
                <Badge variant="outline">{TARGET_TYPE_LABELS[it.type]}</Badge>
                <div className="flex-1 min-w-0">
                  {to ? (
                    <Link to={to} className="font-medium hover:underline truncate block">{it.name}</Link>
                  ) : <span className="font-medium truncate block">{it.name}</span>}
                </div>
                <Badge variant="secondary" className="rounded-full">{it.source}</Badge>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { addBundleItem, fetchBundleItems, removeBundleItem, type AccessTargetType, type BundleItem } from "@/lib/access";
import { TARGET_TYPE_LABELS } from "@/lib/plans";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const db = supabase as any;

export function BundleBuilder({ bundleId }: { bundleId: string }) {
  const [items, setItems] = useState<BundleItem[]>([]);
  const [targetType, setTargetType] = useState<AccessTargetType>("space");
  const [targetId, setTargetId] = useState<string>("");
  const [options, setOptions] = useState<{ id: string; label: string }[]>([]);
  const [resolved, setResolved] = useState<Record<string, string>>({});

  const load = async () => {
    const list = await fetchBundleItems(bundleId);
    setItems(list);
    const map: Record<string, string> = {};
    for (const it of list) {
      if (it.target_type === "platform" || !it.target_id) continue;
      const table = it.target_type === "space" ? "spaces" : it.target_type === "course" ? "courses" : it.target_type === "event" ? "events" : null;
      if (!table) continue;
      const col = it.target_type === "space" ? "name" : "title";
      const { data } = await db.from(table).select(`id, ${col}`).eq("id", it.target_id).maybeSingle();
      if (data) map[it.id] = data[col] ?? "Untitled";
    }
    setResolved(map);
  };
  useEffect(() => { load(); }, [bundleId]);

  useEffect(() => {
    if (targetType === "platform" || targetType === "resource_placeholder") { setOptions([]); setTargetId(""); return; }
    const table = targetType === "space" ? "spaces" : targetType === "course" ? "courses" : "events";
    const col = targetType === "space" ? "name" : "title";
    db.from(table).select(`id, ${col}`).order(col).limit(500).then(({ data }: any) => {
      setOptions((data ?? []).map((x: any) => ({ id: x.id, label: x[col] ?? "Untitled" })));
    });
  }, [targetType]);

  const add = async () => {
    if (targetType !== "platform" && !targetId) return toast.error("Choose a target");
    try {
      await addBundleItem({
        bundle_id: bundleId, target_type: targetType,
        target_id: targetType === "platform" ? null : targetId,
        access_level: "full_access",
      });
      setTargetId(""); load();
    } catch (e: any) { toast.error(e?.message ?? "Could not add"); }
  };

  const remove = async (id: string) => {
    try { await removeBundleItem(id); load(); } catch (e: any) { toast.error(e?.message ?? "Could not remove"); }
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader><h2 className="font-semibold">Bundle items</h2></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-[1fr_2fr_auto] gap-2 items-end">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={targetType} onValueChange={(v) => setTargetType(v as AccessTargetType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TARGET_TYPE_LABELS) as AccessTargetType[]).map((t) => (
                  <SelectItem key={t} value={t}>{TARGET_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {targetType !== "platform" && targetType !== "resource_placeholder" ? (
            <div className="space-y-1.5">
              <Label>Target</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger><SelectValue placeholder="Choose an item" /></SelectTrigger>
                <SelectContent>{options.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ) : <div />}
          <Button onClick={add}><Plus className="size-4 mr-1.5" />Add</Button>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items in this bundle yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-2 rounded-lg border p-2 text-sm">
                <Badge variant="outline">{TARGET_TYPE_LABELS[it.target_type]}</Badge>
                <span className="flex-1 truncate">{it.target_type === "platform" ? "Entire platform" : resolved[it.id] ?? "—"}</span>
                <Button variant="ghost" size="sm" onClick={() => remove(it.id)}><Trash2 className="size-4" /></Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
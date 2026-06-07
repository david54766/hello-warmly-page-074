import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Collection } from "@/lib/spaces";
import { getIcon } from "@/lib/spaces";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminCollectionForm } from "@/components/app/AdminCollectionForm";
import { EmptyState } from "@/components/app/DashboardCard";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, FolderTree, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/collections")({
  component: AdminCollectionsPage,
});

function AdminCollectionsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Collection[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<Collection | null>(null);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate({ to: "/dashboard" });
  }, [authLoading, isAdmin, navigate]);

  const load = async () => {
    setLoading(true);
    const [{ data: cols }, { data: sp }] = await Promise.all([
      supabase.from("collections").select("*").order("sort_order"),
      supabase.from("spaces").select("collection_id"),
    ]);
    setItems((cols ?? []) as Collection[]);
    const c: Record<string, number> = {};
    (sp ?? []).forEach((s) => { if (s.collection_id) c[s.collection_id] = (c[s.collection_id] ?? 0) + 1; });
    setCounts(c);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const move = async (c: Collection, dir: -1 | 1) => {
    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((x) => x.id === c.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    setBusyId(c.id);
    await Promise.all([
      supabase.from("collections").update({ sort_order: swap.sort_order }).eq("id", c.id),
      supabase.from("collections").update({ sort_order: c.sort_order }).eq("id", swap.id),
    ]);
    setBusyId(null);
    load();
  };

  const remove = async (c: Collection) => {
    if ((counts[c.id] ?? 0) > 0) return toast.error("Move or delete Spaces first.");
    if (!confirm(`Delete collection "${c.name}"?`)) return;
    const { error } = await supabase.from("collections").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Collection deleted");
    load();
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Collections</h1>
          <p className="text-muted-foreground mt-1">Group Spaces into navigation sections.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="size-4 mr-1.5" /> New Collection
        </Button>
      </header>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="size-5" />}
          title="No collections yet"
          description="Create your first collection to start organizing Spaces."
          action={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4 mr-1.5" />New Collection</Button>}
        />
      ) : (
        <ul className="space-y-2">
          {items.map((c, i) => {
            const Icon = getIcon(c.icon);
            return (
              <li key={c.id}>
                <Card className="rounded-2xl">
                  <CardContent className="pt-5 flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{c.name}</p>
                      {c.description && <p className="text-sm text-muted-foreground line-clamp-1">{c.description}</p>}
                      <p className="text-xs text-muted-foreground">{counts[c.id] ?? 0} space{(counts[c.id] ?? 0) === 1 ? "" : "s"}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" disabled={i === 0 || busyId === c.id} onClick={() => move(c, -1)}>
                        {busyId === c.id ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" disabled={i === items.length - 1 || busyId === c.id} onClick={() => move(c, 1)}>
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setOpen(true); }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(c)} disabled={(counts[c.id] ?? 0) > 0}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <AdminCollectionForm
        key={editing?.id ?? "new"}
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSaved={load}
      />
    </div>
  );
}
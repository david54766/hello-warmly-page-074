import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/app/DashboardCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { deleteChecklistItem, fetchChecklistItems, reorderChecklistItem, upsertChecklistItem, type ChecklistItem } from "@/lib/onboarding";
import { AdminChecklistForm } from "@/components/onboarding/AdminChecklistForm";

export const Route = createFileRoute("/_authenticated/admin/checklist")({
  component: AdminChecklistPage,
});

function AdminChecklistPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [editing, setEditing] = useState<ChecklistItem | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);

  const reload = async () => setItems(await fetchChecklistItems(true));
  useEffect(() => { if (isAdmin) reload(); }, [isAdmin]);

  if (!isAdmin) return null;

  const toggleActive = async (it: ChecklistItem) => {
    await upsertChecklistItem({ id: it.id, title: it.title, action_type: it.action_type, active: !it.active });
    reload();
  };
  const move = async (it: ChecklistItem, dir: -1 | 1) => {
    const idx = items.findIndex((x) => x.id === it.id);
    const other = items[idx + dir];
    if (!other) return;
    await Promise.all([
      reorderChecklistItem(it.id, other.sort_order),
      reorderChecklistItem(other.id, it.sort_order),
    ]);
    reload();
  };
  const remove = async (it: ChecklistItem) => {
    if (!confirm("Delete this checklist item?")) return;
    try { await deleteChecklistItem(it.id); toast.success("Deleted"); reload(); }
    catch (err: any) { toast.error(err?.message ?? "Could not delete"); }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome Checklist</h1>
          <p className="text-muted-foreground mt-1">Configure the onboarding steps members see when they join.</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="size-4 mr-1.5" />Add item</Button>
      </header>

      {items.length === 0 ? (
        <EmptyState icon={<ListChecks className="size-5" />} title="No checklist items yet" description="Create the first onboarding step for your members." />
      ) : (
        <div className="space-y-2">
          {items.map((it, idx) => (
            <Card key={it.id} className="rounded-2xl">
              <CardContent className="pt-5 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">#{it.sort_order}</span>
                    <span className="font-medium truncate">{it.title}</span>
                    {!it.active && <span className="text-[10px] uppercase tracking-wide rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">Inactive</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Action: {it.action_type.replaceAll("_", " ")}{it.target_type ? ` · Target: ${it.target_type}` : ""}</p>
                </div>
                <Switch checked={it.active} onCheckedChange={() => toggleActive(it)} />
                <Button variant="ghost" size="icon" className="size-8" onClick={() => move(it, -1)} disabled={idx === 0}><ArrowUp className="size-4" /></Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => move(it, 1)} disabled={idx === items.length - 1}><ArrowDown className="size-4" /></Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditing(it)}><Pencil className="size-4" /></Button>
                <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => remove(it)}><Trash2 className="size-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={creating || !!editing} onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit checklist item" : "New checklist item"}</DialogTitle></DialogHeader>
          <AdminChecklistForm
            item={editing}
            onCancel={() => { setCreating(false); setEditing(null); }}
            onDone={() => { setCreating(false); setEditing(null); reload(); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
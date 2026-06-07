import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Award } from "lucide-react";
import { toast } from "sonner";
import { deleteBadge, fetchBadges, type Badge } from "@/lib/gamification";
import { AdminBadgeForm } from "@/components/gamification/AdminBadgeForm";
import { AwardBadgeModal } from "@/components/gamification/AwardBadgeModal";
import { BadgePill } from "@/components/gamification/BadgePill";

export const Route = createFileRoute("/_authenticated/admin/badges")({ component: AdminBadgesPage });

function AdminBadgesPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [editing, setEditing] = useState<Badge | null>(null);
  const [creating, setCreating] = useState(false);
  const [awarding, setAwarding] = useState(false);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);
  const reload = async () => setBadges(await fetchBadges(true));
  useEffect(() => { if (isAdmin) reload(); }, [isAdmin]);
  if (!isAdmin) return null;

  const remove = async (b: Badge) => {
    if (!confirm(`Delete badge "${b.name}"?`)) return;
    try { await deleteBadge(b.id); toast.success("Deleted"); reload(); }
    catch (err: any) { toast.error(err?.message ?? "Could not delete"); }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Badges</h1>
          <p className="text-muted-foreground mt-1">Configure achievement badges and recognize members.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAwarding(true)}><Award className="size-4 mr-1.5" />Award badge</Button>
          <Button onClick={() => setCreating(true)}><Plus className="size-4 mr-1.5" />New badge</Button>
        </div>
      </header>

      <div className="space-y-2">
        {badges.map((b) => (
          <Card key={b.id} className="rounded-2xl">
            <CardContent className="pt-5 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <BadgePill badge={b} />
                  <span className="text-xs text-muted-foreground">+{b.points_value} pts</span>
                  {!b.active && <span className="text-[10px] uppercase tracking-wide rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">Inactive</span>}
                </div>
                {b.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.description}</p>}
              </div>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditing(b)}><Pencil className="size-4" /></Button>
              <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => remove(b)}><Trash2 className="size-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={creating || !!editing} onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit badge" : "New badge"}</DialogTitle></DialogHeader>
          <AdminBadgeForm badge={editing} onCancel={() => { setCreating(false); setEditing(null); }} onDone={() => { setCreating(false); setEditing(null); reload(); }} />
        </DialogContent>
      </Dialog>
      <AwardBadgeModal open={awarding} onOpenChange={setAwarding} onAwarded={reload} />
    </div>
  );
}
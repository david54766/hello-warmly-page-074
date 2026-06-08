import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { deleteBundle, fetchAllBundles, type Bundle } from "@/lib/access";
import { AdminBundleForm } from "@/components/bundles/AdminBundleForm";
import { formatPrice } from "@/lib/plans";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/bundles/")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);
  const load = async () => setBundles(await fetchAllBundles());
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);
  if (!isAdmin) return null;

  const del = async (id: string) => {
    if (!confirm("Delete this bundle?")) return;
    try { await deleteBundle(id); toast.success("Deleted"); load(); }
    catch (e: any) { toast.error(e?.message ?? "Could not delete"); }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Bundles</h1>
          <p className="text-muted-foreground mt-1">Sell groups of premium content together.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="size-4 mr-1.5" />New bundle</Button>
      </header>
      {bundles.length === 0 ? (
        <Card className="rounded-2xl"><CardContent className="pt-6 text-sm text-muted-foreground">No bundles yet.</CardContent></Card>
      ) : (
        <ul className="space-y-2">
          {bundles.map((b) => (
            <li key={b.id}>
              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{b.name}</h3>
                      {b.featured && <Badge>Featured</Badge>}
                      {!b.active && <Badge variant="outline">Inactive</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/admin/bundles/$bundleId" params={{ bundleId: b.id }}>Open builder</Link>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => del(b.id)}>Delete</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {formatPrice(Number(b.price), b.currency)} · {b.description ?? "—"}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <AdminBundleForm open={open} onOpenChange={setOpen} onSaved={() => load()} />
    </div>
  );
}
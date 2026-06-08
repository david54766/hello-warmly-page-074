import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { fetchBundle, type Bundle } from "@/lib/access";
import { BundleBuilder } from "@/components/bundles/BundleBuilder";
import { AdminBundleForm } from "@/components/bundles/AdminBundleForm";
import { formatPrice } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/admin/bundles/$bundleId")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { bundleId } = Route.useParams();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);
  const load = async () => setBundle(await fetchBundle(bundleId));
  useEffect(() => { if (isAdmin) load(); }, [isAdmin, bundleId]);
  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/admin/bundles"><ArrowLeft className="size-4 mr-1.5" />All bundles</Link></Button>
      {!bundle ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <>
          <Card className="rounded-2xl">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">{bundle.name}</h1>
                  <p className="text-sm text-muted-foreground">{formatPrice(Number(bundle.price), bundle.currency)}</p>
                </div>
                <Button variant="outline" onClick={() => setEditing(true)}><Settings className="size-4 mr-1.5" />Edit details</Button>
              </div>
            </CardHeader>
            <CardContent>{bundle.description ?? <span className="text-sm text-muted-foreground">No description.</span>}</CardContent>
          </Card>
          <BundleBuilder bundleId={bundle.id} />
          <AdminBundleForm open={editing} onOpenChange={setEditing} initial={bundle} onSaved={(b) => setBundle(b)} />
        </>
      )}
    </div>
  );
}
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Collection, Space } from "@/lib/spaces";
import { getIcon } from "@/lib/spaces";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdminSpaceForm } from "@/components/app/AdminSpaceForm";
import { PrivacyPill } from "@/components/app/PrivacyPill";
import { AccessPill } from "@/components/app/AccessPill";
import { EmptyState } from "@/components/app/DashboardCard";
import { Plus, Pencil, Archive, ArchiveRestore, Users2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/spaces/")({
  component: AdminSpacesPage,
});

function AdminSpacesPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<Space | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { if (!authLoading && !isAdmin) navigate({ to: "/dashboard" }); }, [authLoading, isAdmin, navigate]);

  const load = async () => {
    setLoading(true);
    const [{ data: sp }, { data: col }, { data: mem }] = await Promise.all([
      supabase.from("spaces").select("*").order("sort_order"),
      supabase.from("collections").select("*").order("sort_order"),
      supabase.from("space_members").select("space_id").eq("status", "active"),
    ]);
    setSpaces((sp ?? []) as Space[]);
    setCollections((col ?? []) as Collection[]);
    const c: Record<string, number> = {};
    (mem ?? []).forEach((m) => { c[m.space_id] = (c[m.space_id] ?? 0) + 1; });
    setCounts(c);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const collectionsById = useMemo(() => new Map(collections.map((c) => [c.id, c])), [collections]);

  const setArchived = async (s: Space, archived: boolean) => {
    const { error } = await supabase.from("spaces").update({ is_archived: archived }).eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success(archived ? "Space archived" : "Space restored");
    load();
  };

  if (!isAdmin) return null;

  const active = spaces.filter((s) => !s.is_archived);
  const archived = spaces.filter((s) => s.is_archived);

  const renderList = (list: Space[]) => list.length === 0 ? (
    <EmptyState icon={<Users2 className="size-5" />} title="No Spaces" description="Create your first Space to get started." />
  ) : (
    <ul className="space-y-2">
      {list.map((s) => {
        const Icon = getIcon(s.icon);
        return (
          <li key={s.id}>
            <Card className="rounded-2xl">
              <CardContent className="pt-5 flex flex-wrap items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <Icon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{s.name}</p>
                    <PrivacyPill level={s.privacy_level} />
                    <AccessPill level={s.access_level} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {collectionsById.get(s.collection_id ?? "")?.name ?? "Uncategorized"} · {counts[s.id] ?? 0} member{(counts[s.id] ?? 0) === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/admin/spaces/$spaceId" params={{ spaceId: s.id }}><Settings2 className="size-4" /></Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setOpen(true); }}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setArchived(s, !s.is_archived)}>
                    {s.is_archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Spaces</h1>
          <p className="text-muted-foreground mt-1">Create and manage Spaces across your platform.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="size-4 mr-1.5" /> New Space
        </Button>
      </header>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
            <TabsTrigger value="archived">Archived ({archived.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="pt-4">{renderList(active)}</TabsContent>
          <TabsContent value="archived" className="pt-4">{renderList(archived)}</TabsContent>
        </Tabs>
      )}

      <AdminSpaceForm
        key={editing?.id ?? "new"}
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        collections={collections}
        onSaved={load}
      />
    </div>
  );
}
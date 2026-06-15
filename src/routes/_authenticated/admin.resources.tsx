import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchAllResourcesAdmin, fetchAllFoldersAdmin, createResource, updateResource, deleteResource,
  getAdminResourceTotals, type Resource, type ResourceFolder,
} from "@/lib/resources";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FolderTree, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminResourceTable } from "@/components/resources/AdminResourceTable";
import { AdminResourceForm } from "@/components/resources/AdminResourceForm";
import { ResourceFilters, type ResourceFilterState } from "@/components/resources/ResourceFilters";
import { AdminStatCard } from "@/components/app/DashboardCard";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/resources")({
  component: AdminResourcesPage,
});

function AdminResourcesPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [spaces, setSpaces] = useState<{ id: string; name: string }[]>([]);
  const [totals, setTotals] = useState({ totalResources: 0, totalViews: 0, totalDownloads: 0 });
  const [filters, setFilters] = useState<ResourceFilterState>({ search: "", type: "all", access: "all", spaceId: "all" });
  const [editing, setEditing] = useState<Partial<Resource> | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [isAdmin, loading, navigate]);

  const reload = async () => {
    const [r, f, { data: sp }, t] = await Promise.all([
      fetchAllResourcesAdmin(),
      fetchAllFoldersAdmin(),
      supabase.from("spaces").select("id,name").order("name"),
      getAdminResourceTotals(),
    ]);
    setResources(r); setFolders(f); setSpaces((sp ?? []) as any); setTotals(t);
  };
  useEffect(() => { if (isAdmin) reload(); }, [isAdmin]);

  const spacesById = useMemo(() => Object.fromEntries(spaces.map((s) => [s.id, s.name])), [spaces]);

  const visible = useMemo(() => resources.filter((r) => {
    if (filters.type !== "all" && r.resource_type !== filters.type) return false;
    if (filters.access !== "all" && r.access_level !== filters.access) return false;
    if (filters.spaceId === "global" && r.space_id) return false;
    if (filters.spaceId !== "all" && filters.spaceId !== "global" && r.space_id !== filters.spaceId) return false;
    if (filters.search && !`${r.title} ${r.description ?? ""}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  }), [resources, filters]);

  const onSubmit = async (values: Partial<Resource>) => {
    try {
      if (editing?.id) await updateResource(editing.id, values);
      else await createResource(values);
      toast.success(editing?.id ? "Resource updated" : "Resource created");
      setOpen(false); setEditing(null);
      await reload();
    } catch (e: any) { toast.error(e?.message ?? "Save failed"); }
  };

  const onDelete = async (r: Resource) => {
    if (!confirm(`Delete "${r.title}"?`)) return;
    try { await deleteResource(r.id); toast.success("Deleted"); reload(); }
    catch (e: any) { toast.error(e?.message ?? "Delete failed"); }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Button variant="ghost" size="sm" asChild><Link to="/admin"><ArrowLeft className="size-4 mr-1.5" />Admin</Link></Button>
          <h1 className="text-2xl font-semibold tracking-tight mt-2">Resources</h1>
          <p className="text-sm text-muted-foreground">Manage downloads, templates, guides, and links for your community.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/admin/resource-folders"><FolderTree className="size-4 mr-1.5" />Folders</Link></Button>
          <Button onClick={() => { setEditing({}); setOpen(true); }}><Plus className="size-4 mr-1.5" />New resource</Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <AdminStatCard label="Total Resources" value={totals.totalResources} />
        <AdminStatCard label="Total Views" value={totals.totalViews} />
        <AdminStatCard label="Total Downloads" value={totals.totalDownloads} />
      </div>

      <Card className="rounded-2xl">
        <CardContent className="pt-5 space-y-4">
          <ResourceFilters value={filters} onChange={setFilters} spaces={spaces} />
          <AdminResourceTable
            resources={visible}
            spacesById={spacesById}
            onEdit={(r) => { setEditing(r); setOpen(true); }}
            onDelete={onDelete}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit resource" : "Create resource"}</DialogTitle></DialogHeader>
          {editing !== null && (
            <AdminResourceForm
              initial={editing}
              folders={folders}
              spaces={spaces}
              onSubmit={onSubmit}
              onCancel={() => { setOpen(false); setEditing(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { fetchResources, fetchFolders, type Resource, type ResourceFolder } from "@/lib/resources";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceFilters, type ResourceFilterState } from "@/components/resources/ResourceFilters";
import { ResourceFolderTree } from "@/components/resources/ResourceFolderTree";
import { EmptyState } from "@/components/app/DashboardCard";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/spaces/$spaceId/resources")({
  component: SpaceResourcesPage,
});

function SpaceResourcesPage() {
  const { spaceId } = Route.useParams();
  const [resources, setResources] = useState<Resource[]>([]);
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [filters, setFilters] = useState<ResourceFilterState>({ search: "", type: "all", access: "all", spaceId: "all" });

  useEffect(() => {
    (async () => {
      const [r, f] = await Promise.all([fetchResources({ spaceId }), fetchFolders({ spaceId })]);
      setResources(r); setFolders(f);
    })();
  }, [spaceId]);

  const visible = useMemo(() => resources.filter((r) => {
    if (activeFolder && r.folder_id !== activeFolder) return false;
    if (filters.type !== "all" && r.resource_type !== filters.type) return false;
    if (filters.access !== "all" && r.access_level !== filters.access) return false;
    if (filters.search && !`${r.title} ${r.description ?? ""}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  }), [resources, activeFolder, filters]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild><Link to="/spaces/$spaceId" params={{ spaceId }}><ArrowLeft className="size-4 mr-1.5" />Back to Space</Link></Button>
          <h1 className="text-2xl font-semibold tracking-tight mt-2">Space resources</h1>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <ResourceFolderTree folders={folders} activeId={activeFolder} onSelect={setActiveFolder} />
        <section className="space-y-4">
          <ResourceFilters value={filters} onChange={setFilters} showSpace={false} />
          {visible.length === 0 ? (
            <EmptyState icon={<BookOpen className="size-5" />} title="No resources in this Space yet." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {visible.map((r) => <ResourceCard key={r.id} resource={r} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchResources, fetchFolders, type Resource, type ResourceFolder } from "@/lib/resources";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceFilters, type ResourceFilterState } from "@/components/resources/ResourceFilters";
import { ResourceFolderTree } from "@/components/resources/ResourceFolderTree";
import { EmptyState } from "@/components/app/DashboardCard";
import { BookOpen, Bookmark, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/resources/")({
  component: ResourceLibraryPage,
});

function ResourceLibraryPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [spaces, setSpaces] = useState<{ id: string; name: string }[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ResourceFilterState>({ search: "", type: "all", access: "all", spaceId: "all" });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [res, fld, { data: sp }] = await Promise.all([
        fetchResources(),
        fetchFolders(),
        supabase.from("spaces").select("id,name").eq("is_archived", false).order("name"),
      ]);
      setResources(res);
      setFolders(fld);
      setSpaces((sp ?? []) as any);
      setLoading(false);
    })();
  }, []);

  const spaceNames = useMemo(() => Object.fromEntries(spaces.map((s) => [s.id, s.name])), [spaces]);

  const visible = useMemo(() => resources.filter((r) => {
    if (activeFolder && r.folder_id !== activeFolder) return false;
    if (filters.type !== "all" && r.resource_type !== filters.type) return false;
    if (filters.access !== "all" && r.access_level !== filters.access) return false;
    if (filters.spaceId === "global" && r.space_id) return false;
    if (filters.spaceId !== "all" && filters.spaceId !== "global" && r.space_id !== filters.spaceId) return false;
    if (filters.search && !`${r.title} ${r.description ?? ""}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  }), [resources, activeFolder, filters]);

  const featured = resources.filter((r) => r.is_featured).slice(0, 4);
  const recent = [...resources].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 4);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Resource Library</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">Find downloads, templates, guides, tools, and helpful materials in one organized place.</p>
        </div>
        <Button variant="outline" asChild><Link to="/saved"><Bookmark className="size-4 mr-1.5" />Saved resources</Link></Button>
      </header>

      {featured.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Featured</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
            {featured.map((r) => <ResourceCard key={r.id} resource={r} spaceName={r.space_id ? spaceNames[r.space_id] : null} />)}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-4">
          <ResourceFolderTree folders={folders.filter((f) => !f.space_id)} activeId={activeFolder} onSelect={setActiveFolder} />
          {recent.length > 0 && (
            <div className="rounded-2xl border bg-card p-4 space-y-2">
              <div className="text-sm font-semibold">Recently added</div>
              <ul className="space-y-1.5">
                {recent.map((r) => (
                  <li key={r.id}>
                    <Link to="/resources/$resourceId" params={{ resourceId: r.id }} className="text-sm text-muted-foreground hover:text-foreground truncate flex items-center gap-1">
                      <ArrowRight className="size-3" />{r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
        <section className="space-y-4">
          <ResourceFilters value={filters} onChange={setFilters} spaces={spaces} />
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
          ) : visible.length === 0 ? (
            <EmptyState icon={<BookOpen className="size-5" />} title="No resources are available yet." description="Try clearing filters or check back soon." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {visible.map((r) => <ResourceCard key={r.id} resource={r} spaceName={r.space_id ? spaceNames[r.space_id] : null} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
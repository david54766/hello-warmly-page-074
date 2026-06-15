import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchResource, getResourceStats, logResourceView, type Resource } from "@/lib/resources";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, File } from "lucide-react";
import { ResourceTypePill } from "@/components/resources/ResourceTypePill";
import { ResourceAccessPill } from "@/components/resources/ResourceAccessPill";
import { SaveResourceButton } from "@/components/resources/SaveResourceButton";
import { DownloadResourceButton } from "@/components/resources/DownloadResourceButton";
import { ResourceStatsCard } from "@/components/resources/ResourceStatsCard";
import { LockedContentCard } from "@/components/access/LockedContentCard";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/resources/$resourceId")({
  component: ResourceDetailPage,
});

function ResourceDetailPage() {
  const { resourceId } = Route.useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [stats, setStats] = useState({ views: 0, downloads: 0 });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetchResource(resourceId);
        if (!r) { setDenied(true); return; }
        setResource(r);
        if (user) logResourceView(r.id, user.id).catch(() => {});
        if (isAdmin) getResourceStats(r.id).then(setStats);
      } catch {
        setDenied(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [resourceId, user?.id]);

  if (loading) return <div className="space-y-3 max-w-3xl mx-auto"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-56 rounded-2xl" /></div>;
  if (denied || !resource) return <LockedContentCard variant="page" title="This resource is locked or unavailable." />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/resources" })}><ArrowLeft className="size-4 mr-1.5" />Back to library</Button>
      <Card className="rounded-2xl overflow-hidden">
        {resource.thumbnail_url ? (
          <img src={resource.thumbnail_url} alt="" className="w-full h-56 object-cover" />
        ) : (
          <div className="h-32 bg-gradient-to-br from-primary/10 to-background grid place-items-center"><File className="size-10 text-primary/50" /></div>
        )}
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{resource.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ResourceTypePill type={resource.resource_type} />
                <ResourceAccessPill level={resource.access_level} />
                {resource.space_id && (
                  <Link to="/spaces/$spaceId" params={{ spaceId: resource.space_id }} className="text-xs text-muted-foreground hover:underline">View Space</Link>
                )}
              </div>
            </div>
            <SaveResourceButton resourceId={resource.id} variant="button" />
          </div>
          {resource.description && <p className="text-muted-foreground whitespace-pre-wrap">{resource.description}</p>}
          <div className="flex flex-wrap gap-2">
            <DownloadResourceButton resource={resource} />
          </div>
        </CardContent>
      </Card>
      {isAdmin && <ResourceStatsCard views={stats.views} downloads={stats.downloads} />}
    </div>
  );
}
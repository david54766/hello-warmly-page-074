import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResourceTypePill } from "./ResourceTypePill";
import { ResourceAccessPill } from "./ResourceAccessPill";
import { SaveResourceButton } from "./SaveResourceButton";
import type { Resource } from "@/lib/resources";

export function ResourceCard({ resource, spaceName }: { resource: Resource; spaceName?: string | null }) {
  return (
    <Card className="rounded-2xl overflow-hidden group">
      <CardContent className="pt-5 flex gap-3">
        <div className="size-14 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 overflow-hidden">
          {resource.thumbnail_url
            ? <img src={resource.thumbnail_url} alt="" className="size-full object-cover" />
            : <File className="size-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link to="/resources/$resourceId" params={{ resourceId: resource.id }} className="font-medium truncate hover:underline">
              {resource.title}
            </Link>
            <SaveResourceButton resourceId={resource.id} />
          </div>
          {resource.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{resource.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <ResourceTypePill type={resource.resource_type} />
            <ResourceAccessPill level={resource.access_level} />
            {spaceName && <span className="text-[11px] text-muted-foreground">· {spaceName}</span>}
            {resource.is_featured && <span className="text-[11px] uppercase tracking-wide text-primary">Featured</span>}
          </div>
          <div className="mt-3">
            <Button asChild size="sm" variant="outline">
              <Link to="/resources/$resourceId" params={{ resourceId: resource.id }}>View</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
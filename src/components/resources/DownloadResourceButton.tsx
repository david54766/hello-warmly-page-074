import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { logResourceDownload, logResourceView, resourceHref, type Resource } from "@/lib/resources";

export function DownloadResourceButton({ resource, className }: { resource: Resource; className?: string }) {
  const { user } = useAuth();
  const href = resourceHref(resource);
  if (!href) return null;
  const isLink = resource.resource_type === "link" || (!resource.file_url && !!resource.external_url);
  const onClick = async () => {
    try {
      if (user) {
        if (isLink) await logResourceView(resource.id, user.id);
        else await logResourceDownload(resource.id, user.id);
      }
    } catch (e: any) {
      console.warn("resource log failed", e?.message);
    }
    window.open(href, "_blank", "noopener,noreferrer");
  };
  return (
    <Button onClick={onClick} className={className}>
      {isLink ? <><ExternalLink className="size-4 mr-1.5" />Open</> : <><Download className="size-4 mr-1.5" />Download</>}
    </Button>
  );
}
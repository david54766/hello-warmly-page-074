import { cn } from "@/lib/utils";
import { RESOURCE_TYPE_LABELS, type ResourceType } from "@/lib/resources";
import { File, Link as LinkIcon, FileText, Video, Image as ImageIcon, ClipboardList, BookOpen, ListChecks, FileType, MoreHorizontal } from "lucide-react";

const ICONS: Record<ResourceType, any> = {
  file: File, link: LinkIcon, pdf: FileText, video: Video, image: ImageIcon,
  document: FileType, template: ClipboardList, checklist: ListChecks, guide: BookOpen, other: MoreHorizontal,
};

export function ResourceTypePill({ type, className }: { type: ResourceType; className?: string }) {
  const Icon = ICONS[type] ?? MoreHorizontal;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 bg-muted text-muted-foreground", className)}>
      <Icon className="size-3" />{RESOURCE_TYPE_LABELS[type]}
    </span>
  );
}
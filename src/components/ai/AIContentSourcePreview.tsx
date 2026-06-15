import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SOURCE_TYPE_LABELS, type AIContentSource } from "@/lib/memberAi";

export function AIContentSourcePreview({ source, open, onOpenChange }: { source: AIContentSource | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{source?.title ?? "Source"}</DialogTitle></DialogHeader>
        {source && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Badge variant="outline">{SOURCE_TYPE_LABELS[source.source_type] ?? source.source_type}</Badge>
              <Badge variant={source.approved_for_member_ai ? "default" : "secondary"}>
                {source.approved_for_member_ai ? "Approved" : "Not approved"}
              </Badge>
            </div>
            <p className="text-sm whitespace-pre-wrap">{source.content ?? "No content."}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

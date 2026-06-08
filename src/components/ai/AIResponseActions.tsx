import { Button } from "@/components/ui/button";
import { Copy, RefreshCw, Save, Upload } from "lucide-react";

export function AIResponseActions({ onCopy, onSave, onRegenerate, onPublish }: { onCopy: () => void; onSave: () => void; onRegenerate: () => void; onPublish?: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={onCopy}><Copy className="size-4 mr-1.5" />Copy</Button>
      <Button variant="outline" size="sm" onClick={onSave}><Save className="size-4 mr-1.5" />Save as draft</Button>
      <Button variant="outline" size="sm" onClick={onRegenerate}><RefreshCw className="size-4 mr-1.5" />Regenerate</Button>
      {onPublish && <Button size="sm" onClick={onPublish}><Upload className="size-4 mr-1.5" />Publish as post</Button>}
    </div>
  );
}
import { Card, CardContent } from "@/components/ui/card";
import { FolderTree, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResourceFolder } from "@/lib/resources";

export function ResourceFolderTree({ folders, activeId, onSelect }: { folders: ResourceFolder[]; activeId: string | null; onSelect: (id: string | null) => void }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="pt-5">
        <div className="flex items-center gap-2 mb-3">
          <FolderTree className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Folders</h3>
        </div>
        <ul className="space-y-1">
          <li>
            <button onClick={() => onSelect(null)} className={cn("w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-accent", activeId === null && "bg-accent font-medium")}>
              All resources
            </button>
          </li>
          {folders.map((f) => (
            <li key={f.id}>
              <button onClick={() => onSelect(f.id)} className={cn("w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-accent flex items-center gap-2", activeId === f.id && "bg-accent font-medium")}>
                <Folder className="size-3.5 text-muted-foreground" />
                <span className="truncate">{f.name}</span>
              </button>
            </li>
          ))}
          {folders.length === 0 && <li className="text-xs text-muted-foreground px-2">No folders yet.</li>}
        </ul>
      </CardContent>
    </Card>
  );
}
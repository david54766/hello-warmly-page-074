import { Card, CardContent } from "@/components/ui/card";
import { Eye, Download } from "lucide-react";

export function ResourceStatsCard({ views, downloads }: { views: number; downloads: number }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="pt-5 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-muted-foreground" />
          <div><div className="text-xs text-muted-foreground">Views</div><div className="font-semibold">{views}</div></div>
        </div>
        <div className="flex items-center gap-2">
          <Download className="size-4 text-muted-foreground" />
          <div><div className="text-xs text-muted-foreground">Downloads</div><div className="font-semibold">{downloads}</div></div>
        </div>
      </CardContent>
    </Card>
  );
}
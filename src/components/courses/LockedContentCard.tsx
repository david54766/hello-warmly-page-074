import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

export function LockedContentCard({ title, description }: { title: string; description?: string }) {
  return (
    <Card className="rounded-2xl border-dashed">
      <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
        <div className="size-10 rounded-full bg-muted text-muted-foreground grid place-items-center">
          <Lock className="size-5" />
        </div>
        <h3 className="font-medium">{title}</h3>
        {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      </CardContent>
    </Card>
  );
}
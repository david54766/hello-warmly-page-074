import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import type { SuggestedAction } from "@/lib/ai";

export function AISuggestedActionCard({ action, onClick }: { action: SuggestedAction; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left w-full">
      <Card className="rounded-xl hover:border-primary/60 transition-colors h-full">
        <CardContent className="pt-5 space-y-1.5">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-4" />
            <p className="font-medium text-sm text-foreground">{action.title}</p>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{action.description}</p>
        </CardContent>
      </Card>
    </button>
  );
}
import { Card, CardContent } from "@/components/ui/card";
import { getIcon, type Collection } from "@/lib/spaces";

export function CollectionCard({ collection, count }: { collection: Collection; count: number }) {
  const Icon = getIcon(collection.icon);
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="pt-6 flex items-start gap-3">
        <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold">{collection.name}</h3>
          {collection.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{collection.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{count} space{count === 1 ? "" : "s"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
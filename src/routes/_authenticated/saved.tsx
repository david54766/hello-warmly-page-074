import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchSaved, type SavedItem } from "@/lib/onboarding";
import { SavedItemsList } from "@/components/onboarding/SavedItemsList";
import { EmptyState } from "@/components/app/DashboardCard";
import { Bookmark } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/saved")({
  component: SavedPage,
});

function SavedPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchSaved(user.id);
    setItems(data);
    setLoading(false);
  };
  useEffect(() => { reload(); }, [user]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Saved Content</h1>
        <p className="text-muted-foreground mt-1">Quickly return to the posts, lessons, events, and resources you want to revisit.</p>
      </header>
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={<Bookmark className="size-5" />} title="You haven't saved anything yet." description="Tap the bookmark on any post, course, lesson, or event to save it here." />
      ) : (
        <SavedItemsList items={items} onUnsave={reload} />
      )}
    </div>
  );
}
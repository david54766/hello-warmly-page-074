import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchRecentSearches, clearRecentSearches } from "@/lib/search";
import { Button } from "@/components/ui/button";
import { Clock, X } from "lucide-react";

export function RecentSearches({ onPick }: { onPick: (q: string) => void }) {
  const { user } = useAuth();
  const [items, setItems] = useState<{ id: string; query: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchRecentSearches(user.id).then((r) => setItems(r.map(({ id, query }) => ({ id, query }))));
  }, [user]);

  async function clearAll() {
    if (!user) return;
    await clearRecentSearches(user.id);
    setItems([]);
  }

  if (!user || items.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2"><Clock className="size-4" /> Recent searches</h3>
        <Button variant="ghost" size="sm" onClick={clearAll}><X className="size-3.5 mr-1" />Clear</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <Button key={i.id} variant="outline" size="sm" onClick={() => onPick(i.query)}>{i.query}</Button>
        ))}
      </div>
    </div>
  );
}
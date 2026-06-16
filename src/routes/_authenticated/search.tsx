import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { searchAll, logSearch, type SearchResult, type SearchType, SEARCH_TYPE_LABELS } from "@/lib/search";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { RecentSearches } from "@/components/search/RecentSearches";
import { Search as SearchIcon } from "lucide-react";

const schema = z.object({
  q: z.string().optional().default(""),
  type: z.enum(["all","spaces","posts","courses","lessons","events","members","resources","announcements"]).optional().default("all"),
});

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: (s) => schema.parse(s),
  component: SearchPage,
});

function SearchPage() {
  const { q, type } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    searchAll(q, type, 25).then((r) => setResults(r)).finally(() => setLoading(false));
    if (user) logSearch(user.id, q, { type });
  }, [q, type, user]);

  const grouped = useMemo(() => {
    const m: Record<string, SearchResult[]> = {};
    for (const r of results) (m[r.type] ||= []).push(r);
    return m;
  }, [results]);

  function setType(t: SearchType) {
    navigate({ to: "/search", search: { q, type: t } as any });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
        <p className="text-muted-foreground mt-1">Find Spaces, posts, lessons, events, members, and resources across the platform.</p>
      </header>

      <GlobalSearchBar className="max-w-none" />

      <SearchFilters value={type} onChange={setType} />

      {!q.trim() && <RecentSearches onPick={(query) => navigate({ to: "/search", search: { q: query, type: "all" } as any })} />}

      {q.trim() && (
        <div className="text-sm text-muted-foreground">
          {loading ? "Searching…" : `${results.length} result${results.length === 1 ? "" : "s"} for "${q}"`}
        </div>
      )}

      {!loading && q.trim() && results.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <SearchIcon className="size-8 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">No results found.</p>
          <p className="text-sm text-muted-foreground">Try a different keyword or filter.</p>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(grouped).map(([t, rs]) => (
          <section key={t} className="space-y-3">
            <h2 className="text-lg font-semibold">{SEARCH_TYPE_LABELS[t as SearchType]} <span className="text-sm text-muted-foreground font-normal">({rs.length})</span></h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {rs.map((r) => <SearchResultCard key={`${r.type}-${r.id}`} result={r} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
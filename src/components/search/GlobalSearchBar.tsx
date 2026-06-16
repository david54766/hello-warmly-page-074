import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchAll, type SearchResult } from "@/lib/search";
import { cn } from "@/lib/utils";

export function GlobalSearchBar({ className }: { className?: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchAll(q, "all", 5);
        setResults(r.slice(0, 8));
      } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  function go() {
    if (!q.trim()) return;
    setOpen(false);
    navigate({ to: "/search", search: { q, type: "all" } as any });
  }

  return (
    <div ref={ref} className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter") go(); }}
          placeholder="Search Spaces, posts, members…"
          className="pl-9"
        />
      </div>
      {open && q.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-popover shadow-lg z-50 overflow-hidden">
          {loading && <div className="p-3 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Searching…</div>}
          {!loading && results.length === 0 && <div className="p-3 text-sm text-muted-foreground">No matches.</div>}
          {!loading && results.length > 0 && (
            <ul className="max-h-80 overflow-y-auto">
              {results.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <button
                    onClick={() => { setOpen(false); navigate({ to: r.href }); }}
                    className="w-full text-left px-3 py-2 hover:bg-accent flex items-start gap-2"
                  >
                    <span className="text-[10px] uppercase tracking-wide bg-muted rounded px-1.5 py-0.5 mt-0.5">{r.type}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate">{r.title}</span>
                      {r.description && <span className="block text-xs text-muted-foreground truncate">{r.description}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button onClick={go} className="block w-full text-left px-3 py-2 text-sm bg-muted/40 hover:bg-muted border-t border-border">
            View all results for "{q}"
          </button>
        </div>
      )}
    </div>
  );
}
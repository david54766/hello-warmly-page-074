import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import type { SearchResult } from "@/lib/search";

export function SearchResultCard({ result }: { result: SearchResult }) {
  return (
    <Card className="rounded-2xl hover:border-primary/40 transition-colors">
      <CardContent className="pt-5">
        <Link to={result.href} className="block">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wide bg-muted rounded px-1.5 py-0.5">{result.type}</span>
            {result.meta && <span className="text-xs text-muted-foreground">{result.meta}</span>}
          </div>
          <h3 className="font-medium">{result.title}</h3>
          {result.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{result.description}</p>}
        </Link>
      </CardContent>
    </Card>
  );
}
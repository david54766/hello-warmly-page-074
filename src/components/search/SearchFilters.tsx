import { Button } from "@/components/ui/button";
import { SEARCH_TYPE_LABELS, type SearchType } from "@/lib/search";

export function SearchFilters({ value, onChange }: { value: SearchType; onChange: (v: SearchType) => void }) {
  const types = Object.keys(SEARCH_TYPE_LABELS) as SearchType[];
  return (
    <div className="flex flex-wrap gap-2">
      {types.map((t) => (
        <Button key={t} size="sm" variant={value === t ? "default" : "outline"} onClick={() => onChange(t)}>
          {SEARCH_TYPE_LABELS[t]}
        </Button>
      ))}
    </div>
  );
}
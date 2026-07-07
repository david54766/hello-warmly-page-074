import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import type { Space } from "@/lib/spaces";

export type FeedFilterValue =
  | "all" | "following" | "posts" | "articles" | "questions" | "unanswered" | "polls" | "from_admins" | "pinned" | "featured" | "my_posts";

export type FeedSort = "newest" | "top";

const FILTERS: { value: FeedFilterValue; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "following", label: "Following" },
  { value: "posts", label: "Posts" },
  { value: "articles", label: "Articles" },
  { value: "questions", label: "Questions" },
  { value: "unanswered", label: "Unanswered" },
  { value: "polls", label: "Polls" },
  { value: "from_admins", label: "From Admins" },
  { value: "pinned", label: "Pinned" },
  { value: "featured", label: "Featured" },
  { value: "my_posts", label: "My Posts" },
];

export function FeedFilters({
  search, onSearchChange,
  filter, onFilterChange,
  sort, onSortChange,
  spaceId, onSpaceChange, spaces,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  filter: FeedFilterValue;
  onFilterChange: (v: FeedFilterValue) => void;
  sort: FeedSort;
  onSortChange: (v: FeedSort) => void;
  spaceId?: string;
  onSpaceChange?: (v: string) => void;
  spaces?: Space[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search posts…"
            className="pl-9"
            maxLength={100}
          />
        </div>
        {spaces && onSpaceChange && (
          <Select value={spaceId ?? "all"} onValueChange={(v) => onSpaceChange(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Spaces" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Spaces</SelectItem>
              {spaces.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={sort} onValueChange={(v) => onSortChange(v as FeedSort)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="top">Top</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-1.5 -mx-1 overflow-x-auto">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(f.value)}
            className="h-7"
          >
            {f.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
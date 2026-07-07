import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EVENT_TYPE_LABELS, type EventType } from "@/lib/events";
import type { Space } from "@/lib/spaces";
import { Search } from "lucide-react";

export type EventTimeFilter = "upcoming" | "past" | "all";

export function EventFilters({
  q,
  setQ,
  spaceId,
  setSpaceId,
  typeFilter,
  setTypeFilter,
  timeFilter,
  setTimeFilter,
  spaces,
}: {
  q: string;
  setQ: (v: string) => void;
  spaceId: string;
  setSpaceId: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  timeFilter: EventTimeFilter;
  setTimeFilter: (v: EventTimeFilter) => void;
  spaces: Space[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
        <Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events…" className="pl-9" />
      </div>
      <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as EventTimeFilter)}>
        <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="upcoming">Upcoming</SelectItem>
          <SelectItem value="past">Past</SelectItem>
          <SelectItem value="all">All</SelectItem>
        </SelectContent>
      </Select>
      <Select value={spaceId} onValueChange={setSpaceId}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="All spaces" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All spaces</SelectItem>
          {spaces.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="All types" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((t) => (
            <SelectItem key={t} value={t}>{EVENT_TYPE_LABELS[t]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_ROLES, ALL_STATUSES, ROLE_LABELS, STATUS_LABELS, type MemberStatus } from "@/lib/members";
import type { AppRole } from "@/hooks/useAuth";
import { Search } from "lucide-react";

export type SortKey = "newest" | "recent" | "name";

export interface FilterState {
  q: string;
  role: AppRole | "all";
  status: MemberStatus | "all";
  sort: SortKey;
}

export function MemberDirectoryFilters({
  state,
  onChange,
  showStatus,
}: {
  state: FilterState;
  onChange: (next: FilterState) => void;
  showStatus?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search members by name…"
          value={state.q}
          onChange={(e) => onChange({ ...state, q: e.target.value })}
          className="pl-9"
        />
      </div>
      <Select value={state.role} onValueChange={(v) => onChange({ ...state, role: v as any })}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Role" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All roles</SelectItem>
          {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
        </SelectContent>
      </Select>
      {showStatus && (
        <Select value={state.status} onValueChange={(v) => onChange({ ...state, status: v as any })}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      <Select value={state.sort} onValueChange={(v) => onChange({ ...state, sort: v as SortKey })}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Sort" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="recent">Recently active</SelectItem>
          <SelectItem value="name">Name (A–Z)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function applyFilters<T extends { full_name: string | null; email: string | null; roles: AppRole[]; status: MemberStatus; created_at: string; last_active_at: string | null }>(
  items: T[],
  state: FilterState,
): T[] {
  const q = state.q.trim().toLowerCase();
  let out = items.filter((m) => {
    if (q) {
      const name = (m.full_name || m.email || "").toLowerCase();
      if (!name.includes(q)) return false;
    }
    if (state.role !== "all" && !m.roles.includes(state.role)) return false;
    if (state.status !== "all" && m.status !== state.status) return false;
    return true;
  });
  out = [...out].sort((a, b) => {
    if (state.sort === "name") return (a.full_name || "").localeCompare(b.full_name || "");
    if (state.sort === "recent") return new Date(b.last_active_at || 0).getTime() - new Date(a.last_active_at || 0).getTime();
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return out;
}
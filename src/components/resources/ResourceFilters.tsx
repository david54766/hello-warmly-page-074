import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RESOURCE_TYPE_LABELS, RESOURCE_ACCESS_LABELS, type ResourceAccessLevel, type ResourceType } from "@/lib/resources";

export interface ResourceFilterState {
  search: string;
  type: ResourceType | "all";
  access: ResourceAccessLevel | "all";
  spaceId: string | "all";
}

export function ResourceFilters({ value, onChange, spaces, showSpace = true }: { value: ResourceFilterState; onChange: (v: ResourceFilterState) => void; spaces?: { id: string; name: string }[]; showSpace?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value })}
        placeholder="Search resources..."
        className="max-w-xs"
      />
      <Select value={value.type} onValueChange={(v) => onChange({ ...value, type: v as any })}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {Object.entries(RESOURCE_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={value.access} onValueChange={(v) => onChange({ ...value, access: v as any })}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Access" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All access</SelectItem>
          {Object.entries(RESOURCE_ACCESS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
        </SelectContent>
      </Select>
      {showSpace && spaces && (
        <Select value={value.spaceId} onValueChange={(v) => onChange({ ...value, spaceId: v })}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Space" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Spaces</SelectItem>
            <SelectItem value="global">Global only</SelectItem>
            {spaces.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
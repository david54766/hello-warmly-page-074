import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_STATUSES, STATUS_LABELS, type MemberStatus } from "@/lib/members";

export function UserStatusSelect({ value, onChange, disabled }: { value: MemberStatus; onChange: (s: MemberStatus) => void; disabled?: boolean }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as MemberStatus)} disabled={disabled}>
      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
      <SelectContent>
        {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
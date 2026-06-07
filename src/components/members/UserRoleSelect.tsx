import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/members";
import type { AppRole } from "@/hooks/useAuth";

export function UserRoleSelect({ value, onChange, disabled }: { value: AppRole; onChange: (r: AppRole) => void; disabled?: boolean }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AppRole)} disabled={disabled}>
      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
      <SelectContent>
        {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type AccessStateValue = "free" | "preview" | "paid" | "hidden";

export function AccessStateSelect({
  value,
  onChange,
  includeHidden = false,
}: {
  value: AccessStateValue | "paid_placeholder";
  onChange: (v: AccessStateValue) => void;
  includeHidden?: boolean;
}) {
  // Normalise legacy paid_placeholder -> paid
  const v = value === "paid_placeholder" ? "paid" : value;
  return (
    <Select value={v} onValueChange={(x) => onChange(x as AccessStateValue)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="free">Free</SelectItem>
        <SelectItem value="preview">Preview</SelectItem>
        <SelectItem value="paid">Paid</SelectItem>
        {includeHidden && <SelectItem value="hidden">Hidden</SelectItem>}
      </SelectContent>
    </Select>
  );
}
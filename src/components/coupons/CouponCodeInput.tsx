import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  validateCoupon, VALIDATION_REASON_LABELS, type CouponAppliesToType, type ValidationResult,
} from "@/lib/coupons";

interface Props {
  appliesToType?: CouponAppliesToType;
  appliesToId?: string | null;
  amount: number;
  applied: ValidationResult | null;
  onApply: (r: ValidationResult) => void;
  onClear: () => void;
}

export function CouponCodeInput({ appliesToType = "all", appliesToId = null, amount, applied, onApply, onClear }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const apply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    const r = await validateCoupon(code, appliesToType, appliesToId, amount);
    setLoading(false);
    if (!r.valid) {
      toast.error(VALIDATION_REASON_LABELS[r.reason ?? "not_found"] ?? "Invalid coupon");
      return;
    }
    onApply(r);
    toast.success(`Coupon applied — ${r.discount_type === "percent" ? `${r.discount_value}% off` : `$${r.discount_value} off`}`);
    setCode("");
  };

  if (applied?.valid) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
        <Tag className="size-4 text-emerald-600" />
        <Badge variant="outline" className="rounded-full border-emerald-500/40 text-emerald-700 dark:text-emerald-300">{applied.code}</Badge>
        <span className="text-sm flex-1">
          {applied.discount_type === "percent" ? `${applied.discount_value}% off` : `$${applied.discount_value} off`}
          {applied.discount_amount ? ` — $${applied.discount_amount.toFixed(2)} discount` : ""}
        </span>
        <Button size="sm" variant="ghost" onClick={onClear}><X className="size-4" /></Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Enter coupon code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), apply())}
      />
      <Button variant="outline" onClick={apply} disabled={loading || !code.trim()}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
      </Button>
    </div>
  );
}
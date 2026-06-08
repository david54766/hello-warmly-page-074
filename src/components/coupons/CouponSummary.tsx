import { Card, CardContent } from "@/components/ui/card";
import type { ValidationResult } from "@/lib/coupons";

export function CouponSummary({ original, applied, currency = "USD" }: {
  original: number;
  applied: ValidationResult | null;
  currency?: string;
}) {
  const discount = applied?.valid ? applied.discount_amount ?? 0 : 0;
  const final = Math.max(0, original - discount);
  const fmt = (n: number) => new Intl.NumberFormat("en-US", {
    style: "currency", currency, minimumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
  return (
    <Card className="rounded-2xl">
      <CardContent className="pt-5 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Original</span><span className="font-medium">{fmt(original)}</span></div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Discount {applied?.code ? `(${applied.code})` : ""}</span>
            <span>−{fmt(discount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-2">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">{fmt(final)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
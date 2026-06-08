import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  createCoupon, updateCoupon, COUPON_TARGET_LABELS,
  type Coupon, type CouponDiscountType, type CouponAppliesToType,
} from "@/lib/coupons";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  coupon?: Coupon | null;
  onSaved: () => void;
}

export function CouponForm({ open, onOpenChange, coupon, onSaved }: Props) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<CouponDiscountType>("percent");
  const [discountValue, setDiscountValue] = useState(10);
  const [appliesToType, setAppliesToType] = useState<CouponAppliesToType>("all");
  const [maxUses, setMaxUses] = useState<string>("");
  const [startsAt, setStartsAt] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (coupon) {
      setCode(coupon.code);
      setDescription(coupon.description ?? "");
      setDiscountType(coupon.discount_type);
      setDiscountValue(Number(coupon.discount_value));
      setAppliesToType(coupon.applies_to_type);
      setMaxUses(coupon.max_uses?.toString() ?? "");
      setStartsAt(coupon.starts_at ? coupon.starts_at.slice(0, 10) : "");
      setExpiresAt(coupon.expires_at ? coupon.expires_at.slice(0, 10) : "");
      setActive(coupon.active);
    } else {
      setCode(""); setDescription(""); setDiscountType("percent"); setDiscountValue(10);
      setAppliesToType("all"); setMaxUses(""); setStartsAt(""); setExpiresAt(""); setActive(true);
    }
  }, [coupon, open]);

  const save = async () => {
    if (!code.trim()) { toast.error("Code is required"); return; }
    setSaving(true);
    try {
      const payload: Partial<Coupon> = {
        code: code.trim(),
        description: description || null,
        discount_type: discountType,
        discount_value: Number(discountValue),
        applies_to_type: appliesToType,
        applies_to_id: null,
        max_uses: maxUses ? Number(maxUses) : null,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        active,
      };
      if (coupon) await updateCoupon(coupon.id, payload);
      else await createCoupon(payload);
      toast.success(coupon ? "Coupon updated" : "Coupon created");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save coupon");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{coupon ? "Edit coupon" : "New coupon"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-1.5">
            <Label>Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WELCOME20" />
          </div>
          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Discount type</Label>
              <select className="h-9 border rounded-md px-2 text-sm bg-background" value={discountType} onChange={(e) => setDiscountType(e.target.value as CouponDiscountType)}>
                <option value="percent">Percent (%)</option>
                <option value="fixed_amount">Fixed amount ($)</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Value</Label>
              <Input type="number" min={0} value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Applies to</Label>
            <select className="h-9 border rounded-md px-2 text-sm bg-background" value={appliesToType} onChange={(e) => setAppliesToType(e.target.value as CouponAppliesToType)}>
              {Object.entries(COUPON_TARGET_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <p className="text-xs text-muted-foreground">Targeting specific items by ID will be enabled when item-pickers ship.</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>Max uses</Label>
              <Input type="number" min={0} placeholder="∞" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Start date</Label>
              <Input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Expires</Label>
              <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={active} onCheckedChange={setActive} id="cp-active" />
            <Label htmlFor="cp-active">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save coupon"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
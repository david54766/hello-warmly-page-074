import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { createBundle, updateBundle, type Bundle } from "@/lib/access";
import { toast } from "sonner";

export function AdminBundleForm({
  open, onOpenChange, initial, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Bundle | null;
  onSaved: (b: Bundle) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? 0));
  const [currency, setCurrency] = useState(initial?.currency ?? "USD");
  const [stripeProduct, setStripeProduct] = useState(initial?.stripe_product_id ?? "");
  const [stripePrice, setStripePrice] = useState(initial?.stripe_price_id ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? 0));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        description: description?.trim() || null,
        price: Number(price) || 0,
        currency: currency.trim().toUpperCase() || "USD",
        stripe_product_id: stripeProduct.trim() || null,
        stripe_price_id: stripePrice.trim() || null,
        active, featured,
        sort_order: Number(sortOrder) || 0,
      };
      if (initial) { await updateBundle(initial.id, payload); onSaved({ ...initial, ...payload }); }
      else { const created = await createBundle(payload); onSaved(created); }
      toast.success(initial ? "Bundle updated" : "Bundle created");
      onOpenChange(false);
    } catch (e: any) { toast.error(e?.message ?? "Could not save bundle"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{initial ? "Edit bundle" : "New bundle"}</DialogTitle></DialogHeader>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={description ?? ""} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label>Price</Label><Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Currency</Label><Input value={currency} onChange={(e) => setCurrency(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Sort order</Label><Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Stripe product ID</Label><Input value={stripeProduct ?? ""} onChange={(e) => setStripeProduct(e.target.value)} placeholder="prod_…" /></div>
          <div className="space-y-1.5"><Label>Stripe price ID</Label><Input value={stripePrice ?? ""} onChange={(e) => setStripePrice(e.target.value)} placeholder="price_…" /></div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-between rounded-lg border p-3"><span className="text-sm">Active</span><Switch checked={active} onCheckedChange={setActive} /></label>
            <label className="flex items-center justify-between rounded-lg border p-3"><span className="text-sm">Featured</span><Switch checked={featured} onCheckedChange={setFeatured} /></label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
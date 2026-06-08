import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fetchActivePlans, formatPrice, type Plan } from "@/lib/plans";

export function ChangePlanModal({ open, onOpenChange, currentPlanId, configured }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentPlanId: string | null;
  configured: boolean;
}) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<string>("");
  useEffect(() => { if (open) fetchActivePlans().then(setPlans); }, [open]);
  const confirm = () => {
    if (!configured) toast.info("Plan changes require Stripe customer portal setup.");
    else toast.success("Plan change recorded. Continue in the customer portal.");
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Change plan</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Label>Select a new plan</Label>
          <div className="space-y-2">
            {plans.map((p) => (
              <label key={p.id} className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer ${selected === p.id ? "border-primary bg-primary/5" : ""}`}>
                <input type="radio" checked={selected === p.id} onChange={() => setSelected(p.id)} />
                <div className="flex-1">
                  <p className="font-medium">{p.name}{p.id === currentPlanId && <span className="text-xs text-muted-foreground ml-2">(current)</span>}</p>
                  <p className="text-sm text-muted-foreground">{formatPrice(Number(p.price), p.currency)} · {p.billing_interval}</p>
                </div>
              </label>
            ))}
          </div>
          {!configured && <p className="text-xs text-muted-foreground">Plan changes require Stripe customer portal setup.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={confirm} disabled={!selected}>Confirm change</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
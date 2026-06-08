import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CancelSubscriptionModal({ open, onOpenChange, configured }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  configured: boolean;
}) {
  const confirm = () => {
    if (configured) toast.success("Cancellation will be processed via Stripe customer portal.");
    else toast.info("Contact support to cancel your membership while billing setup is pending.");
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Cancel membership?</DialogTitle></DialogHeader>
        <div className="space-y-2 text-sm">
          <p>Your access will remain until the end of your current billing period.</p>
          {!configured && <p className="text-muted-foreground">Stripe customer portal isn't connected yet — contact <a className="underline" href="mailto:support@example.com">support@example.com</a> to finish cancellation.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Keep membership</Button>
          <Button variant="destructive" onClick={confirm}>Cancel membership</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
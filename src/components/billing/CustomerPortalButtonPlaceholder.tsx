import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

export function CustomerPortalButtonPlaceholder() {
  return (
    <Button
      size="sm"
      onClick={() => toast.info("Customer portal coming soon", {
        description: "Stripe customer portal will activate once live payments are wired up.",
      })}
    >
      <ExternalLink className="size-4 mr-1.5" />Manage subscription
    </Button>
  );
}
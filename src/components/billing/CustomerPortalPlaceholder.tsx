import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, CreditCard, FileText, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";

const ITEMS = [
  { icon: CreditCard, title: "Manage payment method", desc: "Update card, billing address, and email" },
  { icon: RefreshCw, title: "Change plan", desc: "Upgrade or downgrade your membership" },
  { icon: XCircle, title: "Cancel subscription", desc: "End billing at the next renewal" },
  { icon: FileText, title: "Download invoices", desc: "Get receipts and tax documents" },
];

export function CustomerPortalPlaceholder({ configured = false }: { configured?: boolean }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <h2 className="font-semibold">Customer portal</h2>
        <p className="text-sm text-muted-foreground">All self-service billing actions live in one place once Stripe Customer Portal is connected.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="grid gap-2 sm:grid-cols-2">
          {ITEMS.map((i) => (
            <li key={i.title} className="rounded-xl border p-3 flex gap-3">
              <i.icon className="size-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">{i.title}</p>
                <p className="text-xs text-muted-foreground">{i.desc}</p>
              </div>
            </li>
          ))}
        </ul>
        <Button size="sm" onClick={() => toast.info(configured ? "Portal launch coming soon" : "Customer portal will activate once Stripe is connected.")}>
          <ExternalLink className="size-4 mr-1.5" />Open portal
        </Button>
      </CardContent>
    </Card>
  );
}
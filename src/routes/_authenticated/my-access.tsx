import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMyGrants, type AccessGrant } from "@/lib/access";
import { fetchMySubscription, type Subscription } from "@/lib/billing";
import { fetchPlan, type Plan } from "@/lib/plans";
import { MyAccessList } from "@/components/access/MyAccessList";
import { UpgradePromptCard } from "@/components/access/UpgradePromptCard";

export const Route = createFileRoute("/_authenticated/my-access")({ component: Page });

function Page() {
  const { user } = useAuth();
  const [grants, setGrants] = useState<AccessGrant[] | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [g, s] = await Promise.all([fetchMyGrants(user.id), fetchMySubscription(user.id)]);
      setGrants(g); setSub(s);
      if (s?.plan_id) setPlan(await fetchPlan(s.plan_id));
    })();
  }, [user]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">My Access</h1>
        <p className="text-muted-foreground mt-1">View your membership access, purchased content, and available upgrades.</p>
      </header>
      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold">Current plan</h2></CardHeader>
        <CardContent>
          <p className="text-sm">{plan?.name ?? "Free Member"}{sub ? ` — ${sub.status}` : ""}</p>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold">Granted access</h2></CardHeader>
        <CardContent>
          {grants === null ? <Skeleton className="h-20" /> : <MyAccessList grants={grants} />}
        </CardContent>
      </Card>
      <UpgradePromptCard />
    </div>
  );
}
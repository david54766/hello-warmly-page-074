import { ReactNode, useEffect, useState } from "react";
import { getHelperSettings } from "@/lib/memberAi";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function AIHelperAccessGuard({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "disabled">("loading");
  useEffect(() => { getHelperSettings().then((s) => setState(s?.member_ai_enabled ? "ok" : "disabled")); }, []);
  if (state === "loading") return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  if (state === "disabled") return (
    <div className="p-8 max-w-lg mx-auto">
      <Card>
        <CardContent className="py-10 text-center space-y-2">
          <Sparkles className="size-8 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-semibold">AI Helper not available</h2>
          <p className="text-sm text-muted-foreground">The community AI helper isn't enabled yet. Check back later.</p>
        </CardContent>
      </Card>
    </div>
  );
  return <>{children}</>;
}

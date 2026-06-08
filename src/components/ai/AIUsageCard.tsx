import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";

export function AIUsageCard({ total, chat, drafts }: { total: number; chat: number; drafts: number }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="pt-5">
        <div className="flex items-center gap-2 text-muted-foreground text-sm"><Activity className="size-4" />AI usage (placeholder)</div>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <Stat label="Total events" value={total} />
          <Stat label="Chat" value={chat} />
          <Stat label="Drafts" value={drafts} />
        </div>
        <p className="text-xs text-muted-foreground mt-3">Token counts are placeholders until live AI is configured.</p>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>;
}
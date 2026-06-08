import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { buildPreview, type Automation } from "@/lib/automations";

interface Props {
  automation: Pick<Automation, "trigger_type" | "conditions_json" | "actions_json">;
}

export function AutomationPreview({ automation }: Props) {
  if (!automation.trigger_type) {
    return <p className="text-sm text-muted-foreground">Pick a trigger to see a preview.</p>;
  }
  return (
    <Card className="rounded-2xl bg-muted/40 border-dashed">
      <CardContent className="pt-5 flex gap-3 items-start">
        <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center"><Sparkles className="size-4" /></div>
        <p className="text-sm leading-relaxed">{buildPreview(automation)}</p>
      </CardContent>
    </Card>
  );
}
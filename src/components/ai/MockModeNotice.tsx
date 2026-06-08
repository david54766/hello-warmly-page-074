import { Sparkles } from "lucide-react";

export function MockModeNotice({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 text-sm flex items-start gap-2">
      <Sparkles className="size-4 text-primary mt-0.5" />
      <div>
        <p className="font-medium text-primary">Mock mode</p>
        <p className="text-muted-foreground">All responses below are realistic placeholders. Configure a provider and API key in <span className="font-medium">AI Settings</span> to enable live AI.</p>
      </div>
    </div>
  );
}
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AI_MODELS, AI_PROVIDERS, type AISettings } from "@/lib/ai";
import { ShieldAlert } from "lucide-react";

export function AISettingsForm({ initial, saving, onSubmit }: { initial: AISettings | null; saving: boolean; onSubmit: (patch: Partial<AISettings>) => void }) {
  const [v, setV] = useState<Partial<AISettings>>({
    ai_enabled: initial?.ai_enabled ?? true,
    provider: initial?.provider ?? "mock",
    model: initial?.model ?? "mock-model",
    api_key_placeholder: initial?.api_key_placeholder ?? "",
    temperature: initial?.temperature ?? 0.7,
    max_tokens: initial?.max_tokens ?? 1024,
    mock_mode_enabled: initial?.mock_mode_enabled ?? true,
  });

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>AI configuration</CardTitle>
        <CardDescription>Choose a provider, model, and behavior for the admin AI assistant.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-xl border p-3">
          <div>
            <p className="font-medium">AI enabled</p>
            <p className="text-sm text-muted-foreground">Turn AI features on or off platform-wide.</p>
          </div>
          <Switch checked={!!v.ai_enabled} onCheckedChange={(c) => setV({ ...v, ai_enabled: c })} />
        </div>
        <div className="flex items-center justify-between rounded-xl border p-3">
          <div>
            <p className="font-medium">Mock mode</p>
            <p className="text-sm text-muted-foreground">Use safe placeholder responses without calling a live AI API.</p>
          </div>
          <Switch checked={!!v.mock_mode_enabled} onCheckedChange={(c) => setV({ ...v, mock_mode_enabled: c })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Provider</Label>
            <Select value={v.provider} onValueChange={(val) => setV({ ...v, provider: val as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{AI_PROVIDERS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Model</Label>
            <Select value={v.model} onValueChange={(val) => setV({ ...v, model: val as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{AI_MODELS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>API key (placeholder)</Label>
          <Input type="password" value={v.api_key_placeholder ?? ""} onChange={(e) => setV({ ...v, api_key_placeholder: e.target.value })} placeholder="sk-..." />
          <p className="text-xs text-muted-foreground">Stored masked for reference. For production, store keys via Supabase secrets or environment variables.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Temperature</Label>
            <Input type="number" step="0.1" min="0" max="2" value={v.temperature ?? 0.7} onChange={(e) => setV({ ...v, temperature: parseFloat(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label>Max tokens</Label>
            <Input type="number" min="64" max="8192" value={v.max_tokens ?? 1024} onChange={(e) => setV({ ...v, max_tokens: parseInt(e.target.value) })} />
          </div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm flex items-start gap-2">
          <ShieldAlert className="size-4 text-amber-600 mt-0.5" />
          <p className="text-muted-foreground">Store production AI keys securely using environment variables or Supabase secrets. Do not expose secret keys in the frontend.</p>
        </div>
        <div className="flex justify-end">
          <Button disabled={saving} onClick={() => onSubmit(v)}>{saving ? "Saving..." : "Save settings"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
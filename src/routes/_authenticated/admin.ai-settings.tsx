import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AISettingsForm } from "@/components/ai/AISettingsForm";
import { MockModeNotice } from "@/components/ai/MockModeNotice";
import { getAISettings, upsertAISettings, isMockMode, type AISettings } from "@/lib/ai";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/ai-settings")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/dashboard" }); }, [isAdmin, loading, nav]);
  useEffect(() => { if (isAdmin) getAISettings().then(setSettings); }, [isAdmin]);
  if (!isAdmin) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">AI Settings</h1>
        <p className="text-muted-foreground mt-1">Configure the admin AI assistant provider, model, and safety behavior.</p>
      </header>
      <MockModeNotice enabled={isMockMode(settings)} />
      <AISettingsForm initial={settings} saving={saving} onSubmit={async (patch) => {
        setSaving(true);
        try { const next = await upsertAISettings(patch); setSettings(next); toast.success("Settings saved"); }
        catch (e: any) { toast.error(e?.message ?? "Failed to save"); }
        finally { setSaving(false); }
      }} />
    </div>
  );
}
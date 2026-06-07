import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [theme, setTheme] = useState("system");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setEmailNotif(data.email_notifications_enabled);
          setPushNotif(data.push_notifications_enabled);
          setTheme(data.theme_preference ?? "system");
        }
      });
  }, [user]);

  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("user_preferences").upsert(
      {
        user_id: user.id,
        email_notifications_enabled: emailNotif,
        push_notifications_enabled: pushNotif,
        theme_preference: theme,
      },
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Preferences saved");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Account Preferences</h1>
        <p className="text-muted-foreground mt-1">Control how you receive notifications and how the app looks.</p>
      </header>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <Row label="Email notifications" hint="Receive activity summaries by email.">
            <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
          </Row>
          <Row label="Push notifications" hint="Coming soon — get notified on your devices.">
            <Switch checked={pushNotif} onCheckedChange={setPushNotif} disabled />
          </Row>
          <Link
            to="/settings/notifications"
            className="flex items-center justify-between rounded-xl border px-4 py-3 hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center">
                <Bell className="size-4" />
              </div>
              <div>
                <div className="text-sm font-medium">In-app notification preferences</div>
                <div className="text-xs text-muted-foreground">Choose which updates you want to receive.</div>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-full sm:w-60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save preferences"}</Button>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
      </div>
      {children}
    </div>
  );
}
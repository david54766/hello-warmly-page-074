import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: PlatformSettingsPage,
});

function PlatformSettingsPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [row, setRow] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/dashboard" });
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    supabase.from("platform_settings").select("*").limit(1).maybeSingle().then(({ data }) => setRow(data));
  }, []);

  if (!isAdmin || !row) return null;

  const set = (k: string, v: any) => setRow({ ...row, [k]: v });

  const onSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("platform_settings").update({
      platform_name: row.platform_name,
      tagline: row.tagline,
      description: row.description,
      logo_url: row.logo_url,
      cover_image_url: row.cover_image_url,
      primary_color: row.primary_color,
      secondary_color: row.secondary_color,
      support_email: row.support_email,
      privacy_level: row.privacy_level,
      favicon_url: row.favicon_url,
      button_style: row.button_style,
      card_style: row.card_style,
      sidebar_style: row.sidebar_style,
      login_bg_url: row.login_bg_url,
      role_display_names: row.role_display_names,
    }).eq("id", row.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Platform settings updated");
  };

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your community's branding and core info.</p>
      </header>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Branding</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Platform name"><Input value={row.platform_name ?? ""} onChange={(e) => set("platform_name", e.target.value)} /></Field>
          <Field label="Tagline"><Input value={row.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} /></Field>
          <Field label="Description"><Textarea rows={3} value={row.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Logo URL"><Input value={row.logo_url ?? ""} onChange={(e) => set("logo_url", e.target.value)} /></Field>
            <Field label="Cover image URL"><Input value={row.cover_image_url ?? ""} onChange={(e) => set("cover_image_url", e.target.value)} /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Primary color"><Input type="color" value={row.primary_color ?? "#6366f1"} onChange={(e) => set("primary_color", e.target.value)} /></Field>
            <Field label="Secondary color"><Input type="color" value={row.secondary_color ?? "#0ea5e9"} onChange={(e) => set("secondary_color", e.target.value)} /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Favicon URL (placeholder)"><Input value={row.favicon_url ?? ""} onChange={(e) => set("favicon_url", e.target.value)} placeholder="https://…" /></Field>
            <Field label="Login page background URL"><Input value={row.login_bg_url ?? ""} onChange={(e) => set("login_bg_url", e.target.value)} placeholder="https://…" /></Field>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle>UI style</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Button style">
              <Select value={row.button_style ?? "rounded"} onValueChange={(v) => set("button_style", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rounded">Rounded</SelectItem>
                  <SelectItem value="pill">Pill</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Card style">
              <Select value={row.card_style ?? "rounded"} onValueChange={(v) => set("card_style", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rounded">Rounded</SelectItem>
                  <SelectItem value="flat">Flat</SelectItem>
                  <SelectItem value="elevated">Elevated</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Sidebar style">
              <Select value={row.sidebar_style ?? "default"} onValueChange={(v) => set("sidebar_style", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="hidden">Hidden on member pages</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Branding preview</p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="size-12 rounded-xl border" style={{ background: row.primary_color ?? "#6366f1" }} aria-label="Primary" />
              <div className="size-12 rounded-xl border" style={{ background: row.secondary_color ?? "#0ea5e9" }} aria-label="Secondary" />
              <div className="rounded-lg border px-3 py-1.5 text-sm font-medium" style={{ background: row.primary_color ?? "#6366f1", color: "white" }}>
                {row.platform_name || "MemberHub"}
              </div>
              <span className="text-xs text-muted-foreground">{row.button_style ?? "rounded"} buttons · {row.card_style ?? "rounded"} cards · {row.sidebar_style ?? "default"} sidebar</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Support & access</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Support email"><Input type="email" value={row.support_email ?? ""} onChange={(e) => set("support_email", e.target.value)} /></Field>
          <Field label="Privacy level">
            <Select value={row.privacy_level ?? "private"} onValueChange={(v) => set("privacy_level", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="invite_only">Invite only</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save settings"}</Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
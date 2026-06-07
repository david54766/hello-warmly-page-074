import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchPreferences, savePreferences, DEFAULT_PREFERENCES,
  type NotificationPreferences,
} from "@/lib/notifications";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings/notifications")({
  component: NotificationPreferencesPage,
});

function NotificationPreferencesPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const existing = await fetchPreferences(user.id);
      setPrefs(existing ?? DEFAULT_PREFERENCES(user.id));
      setLoading(false);
    })();
  }, [user]);

  const update = (patch: Partial<NotificationPreferences>) =>
    setPrefs((p) => (p ? { ...p, ...patch } : p));

  const onSave = async () => {
    if (!prefs) return;
    setSaving(true);
    try {
      await savePreferences(prefs);
      toast.success("Preferences saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link to="/settings"><ChevronLeft className="size-4 mr-1" />Account preferences</Link>
        </Button>
        <h1 className="text-3xl font-semibold tracking-tight">Notification Preferences</h1>
        <p className="text-muted-foreground mt-1">Choose which updates you want to receive.</p>
      </div>

      {loading || !prefs ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <>
          <Card className="rounded-2xl">
            <CardHeader><CardTitle>In-app notifications</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <Row label="Comments on your posts" hint="When someone comments on a post you created.">
                <Switch checked={prefs.comments_enabled} onCheckedChange={(v) => update({ comments_enabled: v })} />
              </Row>
              <Row label="Replies to your comments" hint="When someone replies to a comment you left.">
                <Switch checked={prefs.replies_enabled} onCheckedChange={(v) => update({ replies_enabled: v })} />
              </Row>
              <Row label="Reactions" hint="When someone reacts to your posts or comments.">
                <Switch checked={prefs.reactions_enabled} onCheckedChange={(v) => update({ reactions_enabled: v })} />
              </Row>
              <Row label="Event RSVP confirmations" hint="A confirmation when you RSVP to an event.">
                <Switch checked={prefs.event_rsvps_enabled} onCheckedChange={(v) => update({ event_rsvps_enabled: v })} />
              </Row>
              <Row label="Lesson progress" hint="When you complete a lesson.">
                <Switch checked={prefs.lesson_progress_enabled} onCheckedChange={(v) => update({ lesson_progress_enabled: v })} />
              </Row>
              <Row label="Direct & group messages" hint="When you receive a new chat message.">
                <Switch checked={prefs.messages_enabled} onCheckedChange={(v) => update({ messages_enabled: v })} />
              </Row>
              <Row label="Admin announcements" hint="Important platform updates from the team.">
                <Switch checked={prefs.admin_announcements_enabled} onCheckedChange={(v) => update({ admin_announcements_enabled: v })} />
              </Row>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader><CardTitle>Delivery channels</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <Row label="Email notifications" hint="Coming soon — receive activity summaries by email.">
                <Switch checked={prefs.email_notifications_enabled} onCheckedChange={(v) => update({ email_notifications_enabled: v })} disabled />
              </Row>
              <Row label="Push notifications" hint="Coming soon — get notified on your devices.">
                <Switch checked={prefs.push_notifications_enabled} onCheckedChange={(v) => update({ push_notifications_enabled: v })} disabled />
              </Row>
            </CardContent>
          </Card>

          <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save preferences"}</Button>
        </>
      )}
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
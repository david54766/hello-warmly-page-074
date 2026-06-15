import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getHelperSettings, upsertHelperSettings, type AIHelperSettings } from "@/lib/memberAi";

export function AIHelperSettingsForm() {
  const [s, setS] = useState<AIHelperSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getHelperSettings().then(setS); }, []);

  if (!s) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const upd = (patch: Partial<AIHelperSettings>) => setS({ ...s, ...patch });
  const save = async () => {
    setSaving(true);
    try {
      const next = await upsertHelperSettings(s);
      setS(next);
      toast.success("Settings saved");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Member AI Helper</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Row label="Enable member-facing AI helper" desc="Members will see an 'Ask AI Helper' button.">
            <Switch checked={s.member_ai_enabled} onCheckedChange={(v) => upd({ member_ai_enabled: v })} />
          </Row>
          <Row label="Require approved sources only" desc="Only approved content sources are used to answer.">
            <Switch checked={s.require_approved_sources} onCheckedChange={(v) => upd({ require_approved_sources: v })} />
          </Row>
          <div className="space-y-2">
            <Label>Assistant name</Label>
            <Input value={s.assistant_name} onChange={(e) => upd({ assistant_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Assistant instructions</Label>
            <Textarea rows={4} value={s.assistant_instructions} onChange={(e) => upd({ assistant_instructions: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Fallback message</Label>
            <Textarea rows={3} value={s.fallback_message} onChange={(e) => upd({ fallback_message: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Allowed Content</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {([
            ["allow_course_content", "Course content"],
            ["allow_lesson_content", "Lesson content"],
            ["allow_post_content", "Post & announcement content"],
            ["allow_event_content", "Event content"],
            ["allow_resource_content", "Resources & platform pages"],
          ] as const).map(([key, label]) => (
            <Row key={key} label={label}>
              <Switch checked={s[key]} onCheckedChange={(v) => upd({ [key]: v } as any)} />
            </Row>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
      </div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div><div className="text-sm font-medium">{label}</div>{desc && <div className="text-xs text-muted-foreground">{desc}</div>}</div>
      {children}
    </div>
  );
}

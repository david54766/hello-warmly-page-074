import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { TARGET_OPTIONS, type AnnouncementTargetType } from "@/lib/announcements";

interface Props {
  targetType: AnnouncementTargetType;
  targetId: string | null;
  targetRole: string | null;
  onChange: (next: { target_type: AnnouncementTargetType; target_id: string | null; target_role: string | null }) => void;
}

export function AnnouncementTargetSelector({ targetType, targetId, targetRole, onChange }: Props) {
  const [spaces, setSpaces] = useState<{ id: string; name: string }[]>([]);
  const [segments, setSegments] = useState<{ id: string; name: string }[]>([]);
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [s, seg, p] = await Promise.all([
        supabase.from("spaces").select("id,name").eq("is_archived", false).order("name"),
        (supabase as any).from("segments").select("id,name").order("name"),
        (supabase as any).from("plans").select("id,name").order("name"),
      ]);
      setSpaces((s.data ?? []) as any);
      setSegments((seg.data ?? []) as any);
      setPlans((p.data ?? []) as any);
    })();
  }, []);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Target</Label>
        <select
          className="h-9 border rounded-md px-2 text-sm bg-background w-full"
          value={targetType}
          onChange={(e) => onChange({ target_type: e.target.value as AnnouncementTargetType, target_id: null, target_role: null })}
        >
          {TARGET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {targetType === "space" && (
        <div className="space-y-1.5">
          <Label>Space</Label>
          <select className="h-9 border rounded-md px-2 text-sm bg-background w-full" value={targetId ?? ""} onChange={(e) => onChange({ target_type: targetType, target_id: e.target.value || null, target_role: null })}>
            <option value="">Select a space…</option>
            {spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}
      {targetType === "segment" && (
        <div className="space-y-1.5">
          <Label>Segment</Label>
          <select className="h-9 border rounded-md px-2 text-sm bg-background w-full" value={targetId ?? ""} onChange={(e) => onChange({ target_type: targetType, target_id: e.target.value || null, target_role: null })}>
            <option value="">Select a segment…</option>
            {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}
      {targetType === "plan" && (
        <div className="space-y-1.5">
          <Label>Plan</Label>
          <select className="h-9 border rounded-md px-2 text-sm bg-background w-full" value={targetId ?? ""} onChange={(e) => onChange({ target_type: targetType, target_id: e.target.value || null, target_role: null })}>
            <option value="">Select a plan…</option>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}
      {targetType === "role" && (
        <div className="space-y-1.5">
          <Label>Role</Label>
          <select className="h-9 border rounded-md px-2 text-sm bg-background w-full" value={targetRole ?? ""} onChange={(e) => onChange({ target_type: targetType, target_id: null, target_role: e.target.value || null })}>
            <option value="">Select a role…</option>
            <option value="member">Member</option>
            <option value="platform_admin">Platform admin</option>
          </select>
        </div>
      )}
    </div>
  );
}
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchMember,
  fetchActivity,
  formatJoined,
  highestRole,
  setUserRole,
  updateMemberStatus,
  type MemberSummary,
  type ActivitySummary,
  type MemberStatus,
} from "@/lib/members";
import { ProfileHeader } from "@/components/members/ProfileHeader";
import { ProfileActivitySummary } from "@/components/members/ProfileActivitySummary";
import { UserRoleSelect } from "@/components/members/UserRoleSelect";
import { UserStatusSelect } from "@/components/members/UserStatusSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, UserX, UserCheck } from "lucide-react";
import type { AppRole } from "@/hooks/useAuth";
import type { Space } from "@/lib/spaces";
import { MemberInsightCard } from "@/components/ai/MemberInsightCard";
import { GenerateMemberInsightButton } from "@/components/ai/GenerateMemberInsightButton";
import { AIReengagementMessageBox } from "@/components/ai/AIReengagementMessageBox";
import { fetchMemberStats, getLatestInsight, type AIMemberInsight, type MemberActivityStats } from "@/lib/memberAi";

export const Route = createFileRoute("/_authenticated/admin/members/$userId")({
  component: AdminMemberDetail,
});

function AdminMemberDetail() {
  const { userId } = Route.useParams();
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [activity, setActivity] = useState<ActivitySummary | null>(null);
  const [spaces, setSpaces] = useState<{ space: Space; membership_id: string }[]>([]);
  const [allSpaces, setAllSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [insight, setInsight] = useState<AIMemberInsight | null>(null);
  const [memberStats, setMemberStats] = useState<MemberActivityStats | null>(null);

  useEffect(() => { if (!authLoading && !isAdmin) navigate({ to: "/dashboard" }); }, [authLoading, isAdmin, navigate]);

  const load = async () => {
    setLoading(true);
    const [m, a, { data: memRows }, { data: allSp }, ins, stats] = await Promise.all([
      fetchMember(userId),
      fetchActivity(userId),
      supabase.from("space_members").select("id, space_id, spaces(*)").eq("user_id", userId).eq("status", "active"),
      supabase.from("spaces").select("*").eq("is_archived", false).order("name"),
      getLatestInsight(userId),
      fetchMemberStats(userId),
    ]);
    setMember(m);
    setActivity(a);
    setSpaces(((memRows ?? []) as any[]).map((r) => ({ membership_id: r.id, space: r.spaces as Space })).filter((x) => x.space));
    setAllSpaces((allSp ?? []) as Space[]);
    setInsight(ins);
    setMemberStats(stats);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, userId]);

  if (!isAdmin) return null;
  if (loading || !member) return <Skeleton className="h-96 rounded-2xl" />;

  const currentRole = highestRole(member.roles);

  const onRole = async (r: AppRole) => {
    setSaving(true);
    try { await setUserRole(member.id, r); toast.success("Role updated"); await load(); }
    catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const onStatus = async (s: MemberStatus) => {
    setSaving(true);
    try { await updateMemberStatus(member.id, s); toast.success("Status updated"); await load(); }
    catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const addToSpace = async (spaceId: string) => {
    setSaving(true);
    const { error } = await supabase.from("space_members").insert({ space_id: spaceId, user_id: member.id, status: "active", role: "member" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Added to Space");
    await load();
  };

  const removeFromSpace = async (membershipId: string) => {
    setSaving(true);
    const { error } = await supabase.from("space_members").delete().eq("id", membershipId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Removed from Space");
    await load();
  };

  const availableSpaces = allSpaces.filter((s) => !spaces.find((x) => x.space.id === s.id));

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/admin/members"><ArrowLeft className="size-4 mr-1" />All members</Link>
      </Button>

      <ProfileHeader member={member} isAdmin />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activity && <ProfileActivitySummary data={activity} />}

          {insight ? (
            <div className="space-y-3">
              <MemberInsightCard insight={insight} stats={memberStats} />
              <div className="flex gap-2">
                <GenerateMemberInsightButton userId={member.id} memberName={member.full_name} onGenerated={setInsight} label="Regenerate insight" />
              </div>
            </div>
          ) : (
            <Card className="rounded-2xl">
              <CardHeader><CardTitle>AI Member Insight</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Generate an AI-powered summary of this member's activity and a suggested next action.</p>
                <GenerateMemberInsightButton userId={member.id} memberName={member.full_name} onGenerated={setInsight} />
              </CardContent>
            </Card>
          )}

          <AIReengagementMessageBox />

          <Card className="rounded-2xl">
            <CardHeader><CardTitle>Admin actions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-xs text-muted-foreground">Replaces the user's current role.</p>
                </div>
                <UserRoleSelect value={currentRole} onChange={onRole} disabled={saving} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-xs text-muted-foreground">Suspended users cannot post or join Spaces.</p>
                </div>
                <UserStatusSelect value={member.status} onChange={onStatus} disabled={saving} />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {member.status !== "suspended" ? (
                  <Button variant="outline" size="sm" onClick={() => onStatus("suspended")} disabled={saving}>
                    <UserX className="size-4 mr-1.5" />Suspend account
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => onStatus("active")} disabled={saving}>
                    <UserCheck className="size-4 mr-1.5" />Reactivate account
                  </Button>
                )}
                <Button variant="outline" size="sm" disabled title="Removal is a placeholder in this phase">Remove user</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader><CardTitle>Spaces</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {spaces.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not a member of any Space.</p>
              ) : (
                <ul className="space-y-2">
                  {spaces.map(({ space, membership_id }) => (
                    <li key={membership_id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <span className="text-sm font-medium">{space.name}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeFromSpace(membership_id)} disabled={saving}>Remove</Button>
                    </li>
                  ))}
                </ul>
              )}
              {availableSpaces.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">Add to a Space</p>
                  <div className="flex flex-wrap gap-2">
                    {availableSpaces.slice(0, 8).map((s) => (
                      <Button key={s.id} variant="outline" size="sm" onClick={() => addToSpace(s.id)} disabled={saving}>+ {s.name}</Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Email" value={member.email ?? "—"} />
              <Row label="Joined" value={formatJoined(member.created_at)} />
              <Row label="Last active" value={member.last_active_at ? new Date(member.last_active_at).toLocaleString() : "—"} />
              <Row label="Onboarded" value={member.onboarding_completed ? "Yes" : "No"} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}
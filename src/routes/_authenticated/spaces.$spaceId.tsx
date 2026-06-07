import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Collection, Space } from "@/lib/spaces";
import { SpaceHeader } from "@/components/app/SpaceHeader";
import { SpaceTabs } from "@/components/app/SpaceTabs";
import type { SpaceMemberRow } from "@/components/app/SpaceMemberList";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/DashboardCard";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/spaces/$spaceId")({
  component: SpaceDetail,
});

function SpaceDetail() {
  const { spaceId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [space, setSpace] = useState<Space | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [members, setMembers] = useState<SpaceMemberRow[]>([]);

  const load = async () => {
    setLoading(true);
    const { data: sp } = await supabase.from("spaces").select("*").eq("id", spaceId).maybeSingle();
    if (!sp) { setSpace(null); setLoading(false); return; }
    setSpace(sp as Space);

    const tasks: Array<Promise<unknown>> = [];
    if (sp.collection_id) {
      tasks.push(
        Promise.resolve(
          supabase.from("collections").select("*").eq("id", sp.collection_id).maybeSingle()
        ).then(({ data }) => setCollection(data as Collection | null))
      );
    } else setCollection(null);

    tasks.push((async () => {
      const { data: rows } = await supabase
        .from("space_members")
        .select("user_id,role,joined_at")
        .eq("space_id", spaceId)
        .eq("status", "active");
      const ids = (rows ?? []).map((r) => r.user_id);
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id,full_name,email,avatar_url").in("id", ids)
        : { data: [] as { id: string; full_name: string | null; email: string | null; avatar_url: string | null }[] };
      const pmap = new Map((profs ?? []).map((p) => [p.id, p]));
      setMembers((rows ?? []).map((r) => ({
        user_id: r.user_id,
        role: r.role,
        joined_at: r.joined_at,
        profile: pmap.get(r.user_id) ?? null,
      })));
    })());

    await Promise.all(tasks);
    setLoading(false);
  };

  useEffect(() => { load(); }, [spaceId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="aspect-[16/5] rounded-2xl" />
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!space) {
    return (
      <EmptyState
        icon={<Lock className="size-5" />}
        title="Space not found"
        description="This Space may be private or no longer exists."
        action={<Button onClick={() => navigate({ to: "/spaces" })}>Back to Spaces</Button>}
      />
    );
  }

  const isMember = !!user && members.some((m) => m.user_id === user.id);

  return (
    <div className="space-y-8">
      <SpaceHeader
        space={space}
        collectionName={collection?.name}
        memberCount={members.length}
        isMember={isMember}
        onJoinChange={load}
      />
      <SpaceTabs space={space} members={members} />
    </div>
  );
}
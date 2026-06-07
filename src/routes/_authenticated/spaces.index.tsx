import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Collection, Space } from "@/lib/spaces";
import { SpaceCard } from "@/components/app/SpaceCard";
import { EmptyState } from "@/components/app/DashboardCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Users2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/spaces/")({
  component: SpacesDirectory,
});

function SpacesDirectory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [memberRows, setMemberRows] = useState<{ space_id: string; user_id: string }[]>([]);

  const load = async () => {
    setLoading(true);
    const [{ data: sp }, { data: col }, { data: mem }] = await Promise.all([
      supabase.from("spaces").select("*").eq("is_archived", false).order("sort_order"),
      supabase.from("collections").select("*").order("sort_order"),
      supabase.from("space_members").select("space_id,user_id").eq("status", "active"),
    ]);
    setSpaces((sp ?? []) as Space[]);
    setCollections((col ?? []) as Collection[]);
    setMemberRows(mem ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    memberRows.forEach((r) => m.set(r.space_id, (m.get(r.space_id) ?? 0) + 1));
    return m;
  }, [memberRows]);

  const mySpaces = useMemo(() => new Set(memberRows.filter((r) => r.user_id === user?.id).map((r) => r.space_id)), [memberRows, user]);
  const collectionsById = useMemo(() => new Map(collections.map((c) => [c.id, c])), [collections]);

  const grouped = useMemo(() => {
    const map = new Map<string, Space[]>();
    spaces.forEach((s) => {
      const key = s.collection_id ?? "__none";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [spaces]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Explore Spaces</h1>
        <p className="text-muted-foreground mt-1">
          Join focused areas of the community based on your interests, courses, events, or membership level.
        </p>
      </header>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      ) : spaces.length === 0 ? (
        <EmptyState
          icon={<Users2 className="size-5" />}
          title="No Spaces are available yet"
          description="Check back soon."
        />
      ) : (
        collections
          .filter((c) => grouped.has(c.id))
          .map((c) => (
            <section key={c.id} className="space-y-3">
              <h2 className="text-lg font-semibold">{c.name}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {grouped.get(c.id)!.map((s) => (
                  <SpaceCard
                    key={s.id}
                    space={s}
                    collectionName={collectionsById.get(s.collection_id ?? "")?.name}
                    memberCount={counts.get(s.id) ?? 0}
                    isMember={mySpaces.has(s.id)}
                    onJoinChange={load}
                  />
                ))}
              </div>
            </section>
          ))
      )}
    </div>
  );
}
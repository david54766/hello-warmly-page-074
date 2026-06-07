import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchMembers, type MemberSummary } from "@/lib/members";
import { MemberCard } from "@/components/members/MemberCard";
import { MemberDirectoryFilters, applyFilters, type FilterState } from "@/components/members/MemberDirectoryFilters";
import { EmptyState } from "@/components/app/DashboardCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/members/")({
  component: MembersIndex,
});

function MembersIndex() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ q: "", role: "all", status: "all", sort: "newest" });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const m = await fetchMembers();
      // Non-admins only see active members
      setMembers(isAdmin ? m : m.filter((x) => x.status === "active"));
      setLoading(false);
    })();
  }, [isAdmin]);

  const filtered = useMemo(() => applyFilters(members, filters), [members, filters]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Member Directory</h1>
        <p className="text-muted-foreground mt-1">Connect with other members, find familiar faces, and build meaningful relationships.</p>
      </header>

      <MemberDirectoryFilters state={filters} onChange={setFilters} showStatus={isAdmin} />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users className="size-5" />} title="No members found." description="Try adjusting your filters or search." />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{filtered.length} member{filtered.length === 1 ? "" : "s"}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((m) => <MemberCard key={m.id} member={m} showStatus={isAdmin} />)}
          </div>
        </>
      )}
    </div>
  );
}
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchMembers, type MemberSummary } from "@/lib/members";
import { MemberDirectoryFilters, applyFilters, type FilterState } from "@/components/members/MemberDirectoryFilters";
import { AdminMemberTable } from "@/components/members/AdminMemberTable";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/DashboardCard";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/members/")({
  component: AdminMembersIndex,
});

function AdminMembersIndex() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ q: "", role: "all", status: "all", sort: "newest" });

  useEffect(() => { if (!authLoading && !isAdmin) navigate({ to: "/dashboard" }); }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      setMembers(await fetchMembers());
      setLoading(false);
    })();
  }, [isAdmin]);

  const filtered = useMemo(() => applyFilters(members, filters), [members, filters]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Manage Members</h1>
        <p className="text-muted-foreground mt-1">View, search, and manage every member of your community.</p>
      </header>

      <MemberDirectoryFilters state={filters} onChange={setFilters} showStatus />

      {loading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users className="size-5" />} title="No members found." description="Try adjusting your filters." />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{filtered.length} member{filtered.length === 1 ? "" : "s"}</p>
          <AdminMemberTable members={filtered} />
        </>
      )}
    </div>
  );
}
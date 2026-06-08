import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminAccessTable } from "@/components/access/AdminAccessTable";

export const Route = createFileRoute("/_authenticated/admin/access")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);
  if (!isAdmin) return null;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Access Control</h1>
        <p className="text-muted-foreground mt-1">Manage who can access premium Spaces, courses, events, and resources.</p>
      </header>
      <AdminAccessTable />
    </div>
  );
}
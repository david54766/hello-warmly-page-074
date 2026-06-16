import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchCertificates, fetchAllIssuedCertificates, type Certificate, type UserCertificate } from "@/lib/certificates";
import { supabase } from "@/integrations/supabase/client";
import { AdminCertificateForm } from "@/components/certificates/AdminCertificateForm";
import { AdminCertificateTable } from "@/components/certificates/AdminCertificateTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/certificates")({
  component: AdminCertificatesPage,
});

function AdminCertificatesPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [certs, setCerts] = useState<(Certificate & { course_title?: string })[]>([]);
  const [issued, setIssued] = useState<UserCertificate[]>([]);
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);

  async function refresh() {
    const list = await fetchCertificates();
    const ids = Array.from(new Set(list.map((c) => c.course_id)));
    const courseMap: Record<string, string> = {};
    if (ids.length) {
      const { data } = await supabase.from("courses").select("id,title").in("id", ids);
      (data ?? []).forEach((c: any) => { courseMap[c.id] = c.title; });
    }
    setCerts(list.map((c) => ({ ...c, course_title: courseMap[c.course_id] })));
    setIssued(await fetchAllIssuedCertificates());
  }
  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Certificates</h1>
          <p className="text-muted-foreground mt-1">Create completion certificates and track every certificate issued.</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus className="size-4 mr-1.5" />New Certificate</Button>
      </header>

      {showForm && (
        <Card><CardHeader><CardTitle className="text-lg">{editing ? "Edit certificate" : "New certificate"}</CardTitle></CardHeader>
          <CardContent>
            <AdminCertificateForm initial={editing} onSaved={() => { setShowForm(false); setEditing(null); refresh(); }} />
          </CardContent>
        </Card>
      )}

      <Card><CardHeader><CardTitle className="text-lg">Templates ({certs.length})</CardTitle></CardHeader>
        <CardContent>
          <AdminCertificateTable items={certs} onEdit={(c) => { setEditing(c); setShowForm(true); }} onChange={refresh} />
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-lg">Issued certificates ({issued.length})</CardTitle></CardHeader>
        <CardContent>
          {issued.length === 0 ? <p className="text-sm text-muted-foreground">No certificates issued yet.</p> : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Course</TableHead><TableHead>Status</TableHead><TableHead>Issued</TableHead></TableRow></TableHeader>
                <TableBody>
                  {issued.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono text-xs">{u.user_id.slice(0, 8)}</TableCell>
                      <TableCell className="font-mono text-xs">{u.course_id.slice(0, 8)}</TableCell>
                      <TableCell className="capitalize">{u.status}</TableCell>
                      <TableCell>{new Date(u.issued_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
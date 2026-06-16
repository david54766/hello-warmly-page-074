import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyCertificates, type UserCertificate } from "@/lib/certificates";
import { supabase } from "@/integrations/supabase/client";
import { CertificateCard } from "@/components/certificates/CertificateCard";
import { Award } from "lucide-react";

export const Route = createFileRoute("/_authenticated/certificates/")({
  component: MyCertificatesPage,
});

function MyCertificatesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<UserCertificate[]>([]);
  const [meta, setMeta] = useState<Record<string, { courseTitle?: string; certTitle?: string }>>({});

  useEffect(() => {
    if (!user) return;
    fetchMyCertificates(user.id).then(async (list) => {
      setItems(list);
      const courseIds = Array.from(new Set(list.map((l) => l.course_id)));
      const certIds = Array.from(new Set(list.map((l) => l.certificate_id)));
      const [{ data: cs }, { data: ts }] = await Promise.all([
        courseIds.length ? supabase.from("courses").select("id,title").in("id", courseIds) : Promise.resolve({ data: [] } as any),
        certIds.length ? (supabase as any).from("certificates").select("id,title").in("id", certIds) : Promise.resolve({ data: [] } as any),
      ]);
      const m: Record<string, { courseTitle?: string; certTitle?: string }> = {};
      list.forEach((l) => {
        m[l.id] = {
          courseTitle: (cs ?? []).find((c: any) => c.id === l.course_id)?.title,
          certTitle: (ts ?? []).find((c: any) => c.id === l.certificate_id)?.title,
        };
      });
      setMeta(m);
    });
  }, [user]);

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">My Certificates</h1>
        <p className="text-muted-foreground mt-1">View and download the certificates you have earned by completing courses.</p>
      </header>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Award className="size-8 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">No certificates yet.</p>
          <p className="text-sm text-muted-foreground">Complete a course to earn your first certificate.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((u) => (
            <CertificateCard key={u.id} uc={u} courseTitle={meta[u.id]?.courseTitle} certTitle={meta[u.id]?.certTitle} />
          ))}
        </div>
      )}
    </div>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchUserCertificate, type UserCertificate } from "@/lib/certificates";
import { supabase } from "@/integrations/supabase/client";
import { CertificateDetail } from "@/components/certificates/CertificateDetail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/certificates/$certificateId")({
  component: CertificateDetailPage,
});

function CertificateDetailPage() {
  const { certificateId } = Route.useParams();
  const { user, profile } = useAuth();
  const [uc, setUc] = useState<UserCertificate | null>(null);
  const [info, setInfo] = useState<{ courseTitle?: string; certTitle?: string; description?: string | null; memberName?: string }>({});

  useEffect(() => {
    (async () => {
      const u = await fetchUserCertificate(certificateId);
      if (!u) return;
      setUc(u);
      const [{ data: cs }, { data: ts }, { data: ps }] = await Promise.all([
        supabase.from("courses").select("title").eq("id", u.course_id).maybeSingle(),
        (supabase as any).from("certificates").select("title,description").eq("id", u.certificate_id).maybeSingle(),
        supabase.from("profiles").select("full_name,email").eq("id", u.user_id).maybeSingle(),
      ]);
      setInfo({
        courseTitle: (cs as any)?.title,
        certTitle: (ts as any)?.title ?? "Certificate of Completion",
        description: (ts as any)?.description,
        memberName: (ps as any)?.full_name || (ps as any)?.email || profile?.full_name || "Member",
      });
    })();
  }, [certificateId, profile]);

  if (!uc) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (user && uc.user_id !== user.id) {
    return <p className="text-sm text-muted-foreground">You don't have access to this certificate.</p>;
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="print:hidden">
        <Button variant="ghost" size="sm" asChild><Link to="/certificates"><ArrowLeft className="size-4 mr-1" />Back</Link></Button>
      </div>
      <CertificateDetail
        title={info.certTitle ?? "Certificate"}
        description={info.description}
        memberName={info.memberName ?? "Member"}
        courseTitle={info.courseTitle ?? "Course"}
        issuedAt={uc.issued_at}
        certificateId={uc.id}
      />
    </div>
  );
}
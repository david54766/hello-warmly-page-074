import { Link } from "@tanstack/react-router";
import { Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { UserCertificate } from "@/lib/certificates";

export function CertificateCard({ uc, courseTitle, certTitle }: { uc: UserCertificate; courseTitle?: string; certTitle?: string }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <div className="size-12 rounded-xl bg-amber-500/10 text-amber-600 grid place-items-center">
            <Award className="size-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{certTitle ?? "Certificate"}</p>
            {courseTitle && <p className="text-sm text-muted-foreground truncate">{courseTitle}</p>}
            <p className="text-xs text-muted-foreground mt-1">Issued {new Date(uc.issued_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button asChild size="sm"><Link to="/certificates/$certificateId" params={{ certificateId: uc.id }}>View</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}
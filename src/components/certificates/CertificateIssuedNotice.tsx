import { Link } from "@tanstack/react-router";
import { Award } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CertificateIssuedNotice({ userCertificateId, courseTitle, available }: { userCertificateId?: string | null; courseTitle?: string; available?: boolean }) {
  if (userCertificateId) {
    return (
      <div className="rounded-xl border border-amber-400/40 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-center gap-3">
        <Award className="size-5 text-amber-600" />
        <div className="flex-1 text-sm">
          <p className="font-medium">Certificate earned</p>
          <p className="text-muted-foreground">{courseTitle ?? "You completed this course."}</p>
        </div>
        <Button asChild size="sm"><Link to="/certificates/$certificateId" params={{ certificateId: userCertificateId }}>View</Link></Button>
      </div>
    );
  }
  if (available) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
        <Award className="size-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Certificate available after completion.</p>
      </div>
    );
  }
  return null;
}
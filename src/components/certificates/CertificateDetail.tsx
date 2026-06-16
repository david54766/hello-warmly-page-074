import { Award, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CertificateDetail(props: {
  title: string;
  description?: string | null;
  memberName: string;
  courseTitle: string;
  issuedAt: string;
  certificateId: string;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border-4 border-double border-amber-400/60 bg-gradient-to-br from-amber-50 via-white to-amber-50 dark:from-amber-950/30 dark:via-background dark:to-amber-950/30 p-10 sm:p-16 text-center space-y-6 print:border-2">
        <div className="size-16 rounded-full bg-amber-500/15 text-amber-600 grid place-items-center mx-auto">
          <Award className="size-8" />
        </div>
        <p className="uppercase tracking-[0.3em] text-xs text-muted-foreground">Certificate of Completion</p>
        <h1 className="text-3xl sm:text-4xl font-serif font-semibold">{props.title}</h1>
        {props.description && <p className="text-muted-foreground max-w-xl mx-auto">{props.description}</p>}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">This certifies that</p>
          <p className="text-2xl sm:text-3xl font-serif font-medium">{props.memberName}</p>
          <p className="text-sm text-muted-foreground">has successfully completed</p>
          <p className="text-lg font-medium">{props.courseTitle}</p>
        </div>
        <div className="flex items-center justify-between max-w-md mx-auto text-xs text-muted-foreground border-t border-amber-400/30 pt-4">
          <span>Issued {new Date(props.issuedAt).toLocaleDateString()}</span>
          <span>ID: {props.certificateId.slice(0, 8)}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center print:hidden">
        <Button onClick={() => toast.info("PDF download coming soon")}><Download className="size-4 mr-2" />Download</Button>
        <Button variant="outline" onClick={() => toast.info("Share coming soon")}><Share2 className="size-4 mr-2" />Share</Button>
        <Button variant="outline" onClick={() => window.print()}>Print</Button>
      </div>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminAnnouncement } from "@/lib/announcements";

export function AnnouncementDetail({ a, showTarget }: { a: AdminAnnouncement; showTarget?: boolean }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {a.title} {a.pinned && <span className="text-amber-600 text-sm">📌</span>}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {a.sent_at ? `Sent ${new Date(a.sent_at).toLocaleString()}` : "Not sent"}
          {showTarget && ` · Target: ${a.target_type.replace("_", " ")}`}
        </p>
      </CardHeader>
      <CardContent>
        {a.body ? <p className="whitespace-pre-wrap text-sm">{a.body}</p> : <p className="text-sm text-muted-foreground">No content.</p>}
      </CardContent>
    </Card>
  );
}
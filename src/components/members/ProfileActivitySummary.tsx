import { Card, CardContent } from "@/components/ui/card";
import { FileText, MessageSquare, GraduationCap, Calendar, Users2 } from "lucide-react";
import type { ActivitySummary } from "@/lib/members";

export function ProfileActivitySummary({ data }: { data: ActivitySummary }) {
  const items = [
    { label: "Posts", value: data.posts, icon: <FileText className="size-4" /> },
    { label: "Comments", value: data.comments, icon: <MessageSquare className="size-4" /> },
    { label: "Lessons completed", value: data.lessons_completed, icon: <GraduationCap className="size-4" /> },
    { label: "Events RSVPed", value: data.events_rsvped, icon: <Calendar className="size-4" /> },
    { label: "Spaces joined", value: data.spaces_joined, icon: <Users2 className="size-4" /> },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((it) => (
        <Card key={it.label} className="rounded-2xl">
          <CardContent className="pt-5">
            <div className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">{it.icon}{it.label}</div>
            <div className="mt-1 text-2xl font-semibold">{it.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
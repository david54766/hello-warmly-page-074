import { Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Badge } from "@/lib/gamification";
import { cn } from "@/lib/utils";

export function BadgeCard({ badge, earned = true, awardedAt, className }: { badge: Badge; earned?: boolean; awardedAt?: string | null; className?: string }) {
  return (
    <Card className={cn("rounded-2xl", !earned && "opacity-60", className)}>
      <CardContent className="pt-5 flex gap-3">
        <div className="size-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary grid place-items-center shrink-0">
          {badge.icon_url ? (
            <img src={badge.icon_url} alt="" className="size-10 rounded-xl object-cover" />
          ) : (
            <Award className="size-6" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{badge.name}</p>
            <span className="text-[10px] uppercase tracking-wide rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">{badge.badge_type}</span>
          </div>
          {badge.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{badge.description}</p>}
          <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span>+{badge.points_value} pts</span>
            {earned && awardedAt && <span>· Earned {new Date(awardedAt).toLocaleDateString()}</span>}
            {!earned && <span>· Locked</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
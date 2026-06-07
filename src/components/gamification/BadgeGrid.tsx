import { BadgeCard } from "./BadgeCard";
import type { Badge, UserBadge } from "@/lib/gamification";

export function BadgeGrid({ badges, userBadges }: { badges: Badge[]; userBadges: UserBadge[] }) {
  const earned = new Map<string, UserBadge>();
  userBadges.forEach((ub) => earned.set(ub.badge_id, ub));
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {badges.map((b) => {
        const ub = earned.get(b.id);
        return <BadgeCard key={b.id} badge={b} earned={!!ub} awardedAt={ub?.awarded_at} />;
      })}
    </div>
  );
}
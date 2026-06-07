import { Link } from "@tanstack/react-router";
import { type LeaderboardRow, SOURCE_LABELS } from "@/lib/gamification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PointsDisplay } from "./PointsDisplay";
import { Award, Trophy } from "lucide-react";

function initials(name?: string | null, email?: string | null) {
  const s = (name ?? email ?? "?").trim();
  return s.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No leaderboard activity yet. Start engaging to earn points.</p>;
  }
  return (
    <ol className="space-y-2">
      {rows.map((r, idx) => {
        const rank = idx + 1;
        const top3 = rank <= 3;
        return (
          <li key={r.user_id}>
            <Link
              to="/members/$userId"
              params={{ userId: r.user_id }}
              className="flex items-center gap-4 rounded-2xl border bg-card px-4 py-3 hover:bg-accent transition-colors"
            >
              <div className={`grid place-items-center size-8 rounded-full font-bold text-sm shrink-0 ${
                rank === 1 ? "bg-amber-500/15 text-amber-600" :
                rank === 2 ? "bg-slate-400/15 text-slate-500" :
                rank === 3 ? "bg-orange-600/15 text-orange-600" :
                "bg-muted text-muted-foreground"
              }`}>
                {top3 ? <Trophy className="size-4" /> : rank}
              </div>
              <Avatar className="size-10">
                <AvatarImage src={r.avatar_url ?? undefined} alt="" />
                <AvatarFallback>{initials(r.full_name, r.email)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{r.full_name || r.email || "Member"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {r.top_source ? `Top: ${SOURCE_LABELS[r.top_source]}` : "—"}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                <Award className="size-3.5" />{r.badges_count}
              </div>
              <PointsDisplay points={r.points} />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
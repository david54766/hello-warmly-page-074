import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users2, Newspaper, GraduationCap, Calendar, UserCircle2,
  BookOpen, MessageSquare, CreditCard, Sparkles, Shield, User, Settings,
  Bookmark, UserPlus, Trophy, Award, type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { UnreadChatBadge } from "@/components/chat/UnreadChatBadge";

type NavItem = { label: string; to: string; icon: LucideIcon; comingSoon?: boolean; adminOnly?: boolean };

const items: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Spaces", to: "/spaces", icon: Users2 },
  { label: "Feed", to: "/feed", icon: Newspaper },
  { label: "Courses", to: "/courses", icon: GraduationCap },
  { label: "Events", to: "/events", icon: Calendar },
  { label: "Members", to: "/members", icon: UserCircle2 },
  { label: "Following", to: "/following", icon: UserPlus },
  { label: "Saved", to: "/saved", icon: Bookmark },
  { label: "Chat", to: "/chat", icon: MessageSquare },
  { label: "Leaderboard", to: "/leaderboard", icon: Trophy },
  { label: "Achievements", to: "/achievements", icon: Award },
  { label: "Plans", to: "/plans", icon: CreditCard },
  { label: "Billing", to: "/billing", icon: CreditCard },
  { label: "Resources", to: "/coming-soon/resources", icon: BookOpen, comingSoon: true },
  { label: "AI Assistant", to: "/coming-soon/ai", icon: Sparkles, comingSoon: true },
];

const footerItems: NavItem[] = [
  { label: "Profile", to: "/profile", icon: User },
  { label: "Settings", to: "/settings", icon: Settings },
];

export function Sidebar() {
  const { isAdmin } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar h-screen sticky top-0">
      <div className="px-6 h-16 flex items-center border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary grid place-items-center text-primary-foreground font-bold">M</div>
          <span className="font-semibold tracking-tight">MemberHub</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((it) => (
          <NavLink key={it.to} item={it} active={pathname === it.to || pathname.startsWith(it.to + "/")} />
        ))}
        {isAdmin && (
          <NavLink
            item={{ label: "Admin", to: "/admin", icon: Shield }}
            active={pathname.startsWith("/admin")}
          />
        )}
      </nav>
      <div className="border-t border-border px-3 py-3 space-y-1">
        {footerItems.map((it) => (
          <NavLink key={it.to} item={it} active={pathname === it.to} />
        ))}
      </div>
    </aside>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.to === "/chat" && <UnreadChatBadge />}
      {item.comingSoon && (
        <span className="text-[10px] uppercase tracking-wide rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">
          Soon
        </span>
      )}
    </Link>
  );
}
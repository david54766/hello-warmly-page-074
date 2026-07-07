import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Users2, Newspaper, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { UnreadChatBadge } from "@/components/chat/UnreadChatBadge";

const items = [
  { label: "Home", to: "/dashboard", icon: Home },
  { label: "Spaces", to: "/spaces", icon: Users2 },
  { label: "Feed", to: "/feed", icon: Newspaper },
  { label: "Chat", to: "/chat", icon: MessageSquare },
  { label: "Profile", to: "/profile", icon: User },
];

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5">
        {items.map(({ label, to, icon: Icon }) => {
          const active = pathname === to;
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span className="relative">
                  <span
                    className={cn(
                      "flex items-center justify-center rounded-full px-4 py-1 transition-colors",
                      active ? "bg-primary/12" : "bg-transparent"
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  {to === "/chat" && <span className="absolute -top-0.5 right-1"><UnreadChatBadge /></span>}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

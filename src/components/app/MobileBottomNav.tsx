import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Users2, Newspaper, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Home", to: "/dashboard", icon: Home },
  { label: "Spaces", to: "/spaces", icon: Users2 },
  { label: "Feed", to: "/feed", icon: Newspaper },
  { label: "Events", to: "/events", icon: Calendar },
  { label: "Profile", to: "/profile", icon: User },
];

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <ul className="grid grid-cols-5">
        {items.map(({ label, to, icon: Icon }) => {
          const active = pathname === to;
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px]",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, Shield, Search } from "lucide-react";
import { toast } from "sonner";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";
import { BrandLogo } from "@/components/app/BrandLogo";

export function TopBar() {
  const { profile, user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "?";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
      <div className="h-16 flex items-center px-4 sm:px-6 lg:px-8 gap-3">
      <Link to="/dashboard" className="md:hidden flex items-center gap-2 min-w-0">
        <BrandLogo className="size-8 rounded-lg shrink-0" />
        <span className="font-semibold truncate">Prima Donna Social</span>
      </Link>
      <div className="flex-1 max-w-md hidden sm:block">
        <GlobalSearchBar />
      </div>
      <div className="flex-1 sm:hidden" />
      <Link
        to="/search"
        aria-label="Search"
        className="sm:hidden inline-flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
      >
        <Search className="size-5" />
      </Link>
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="rounded-full p-0 size-9">
            <Avatar className="size-9">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="text-sm font-medium truncate">{profile?.full_name || "Member"}</div>
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile"><User className="size-4 mr-2" />Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings"><Settings className="size-4 mr-2" />Settings</Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link to="/admin"><Shield className="size-4 mr-2" />Admin</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="size-4 mr-2" />Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
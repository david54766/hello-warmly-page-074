import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { DashboardCard } from "@/components/app/DashboardCard";
import { BookOpen, Users2, MessageSquare, Calendar, UserCircle2, Bookmark } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { profile } = useAuth();
  const cards = [
    { title: "Continue Learning", icon: <BookOpen className="size-4" />, msg: "Your courses will appear here." },
    { title: "Featured Spaces", icon: <Users2 className="size-4" />, msg: "Discover communities to join." },
    { title: "Latest Discussions", icon: <MessageSquare className="size-4" />, msg: "Conversations from your spaces." },
    { title: "Upcoming Events", icon: <Calendar className="size-4" />, msg: "Live sessions and meetups." },
    { title: "Suggested Members", icon: <UserCircle2 className="size-4" />, msg: "People you may want to follow." },
    { title: "Saved Resources", icon: <Bookmark className="size-4" />, msg: "Bookmarks and downloads." },
  ];
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in your community today.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <DashboardCard key={c.title} title={c.title} icon={c.icon} comingSoon>
            <p className="text-sm text-muted-foreground">{c.msg}</p>
          </DashboardCard>
        ))}
      </div>
    </div>
  );
}
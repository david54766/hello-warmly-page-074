import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Users2, GraduationCap, Calendar, BookOpen, UserCircle2, TrendingUp,
  ArrowRight, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MemberHub — Your private community for learning, connection, and growth" },
      { name: "description", content: "Access courses, live events, expert resources, and a supportive member community all in one place." },
      { property: "og:title", content: "MemberHub" },
      { property: "og:description", content: "Your private community for learning, connection, and growth." },
    ],
  }),
  component: Landing,
});

const features = [
  { title: "Community Spaces", desc: "Focused rooms for every topic, project, and cohort.", icon: Users2 },
  { title: "Online Courses", desc: "Self-paced learning paths with progress tracking.", icon: GraduationCap },
  { title: "Live Events", desc: "Workshops, AMAs, and meetups that bring people together.", icon: Calendar },
  { title: "Resource Library", desc: "A curated home for guides, templates, and downloads.", icon: BookOpen },
  { title: "Member Profiles", desc: "Rich profiles so your community can actually connect.", icon: UserCircle2 },
  { title: "Progress Tracking", desc: "See how members move from curious to confident.", icon: TrendingUp },
];

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary grid place-items-center text-primary-foreground font-bold">M</div>
            <span className="font-semibold tracking-tight">MemberHub</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost"><Link to="/auth">Member Login</Link></Button>
            <Button asChild><Link to="/auth">Join</Link></Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-accent/40 via-background to-background" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
            <Sparkles className="size-3.5 text-primary" /> Premium community platform
          </span>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-balance">
            Your private community for learning, connection, and growth.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Access courses, live events, expert resources, and a supportive member community all in one place.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link to="/auth">Join the Community <ArrowRight className="size-4 ml-2" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-6">
              <Link to="/auth">Member Login</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Everything your members need in one simple platform.
          </h2>
          <p className="text-muted-foreground mt-3">
            Bring your courses, events, and conversations together — without the duct tape.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, desc, icon: Icon }) => (
            <Card key={title} className="rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border-border/70">
              <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4">
                <Icon className="size-5" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Ready to bring your community home?</h2>
          <p className="text-muted-foreground mt-3">Create your free member account in under a minute.</p>
          <div className="mt-6">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link to="/auth">Join the Community</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} MemberHub</span>
          <Link to="/auth" className="hover:text-foreground">Sign in</Link>
        </div>
      </footer>
    </main>
  );
}

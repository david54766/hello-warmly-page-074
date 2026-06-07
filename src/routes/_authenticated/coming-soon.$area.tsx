import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/coming-soon/$area")({
  component: ComingSoonPage,
});

const titles: Record<string, { title: string; desc: string }> = {
  spaces: { title: "Spaces", desc: "Curated community spaces for focused conversation." },
  feed: { title: "Feed", desc: "The pulse of your community." },
  courses: { title: "Courses", desc: "Online learning paths for your members." },
  events: { title: "Events", desc: "Live workshops, calls, and meetups." },
  members: { title: "Members", desc: "Browse everyone in your community." },
  resources: { title: "Resource Library", desc: "Downloads, guides, and references." },
  chat: { title: "Chat", desc: "Direct messages and group chats." },
  billing: { title: "Billing", desc: "Payments, subscriptions, and invoices." },
  ai: { title: "AI Assistant", desc: "Your community-aware AI helper." },
};

function ComingSoonPage() {
  const { area } = Route.useParams();
  const meta = titles[area] ?? { title: area, desc: "This area is coming soon." };
  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card className="rounded-2xl p-10 text-center space-y-4">
        <div className="size-14 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto">
          <Sparkles className="size-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{meta.title}</h1>
        <p className="text-muted-foreground">{meta.desc}</p>
        <p className="text-xs uppercase tracking-wide text-primary font-medium">Coming soon</p>
      </Card>
    </div>
  );
}
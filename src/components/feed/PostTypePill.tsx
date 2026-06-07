import { cn } from "@/lib/utils";
import { POST_TYPE_LABELS, type PostType } from "@/lib/feed";
import { MessageSquare, FileText, HelpCircle, Calendar, BarChart3 } from "lucide-react";

const ICONS: Record<PostType, React.ComponentType<{ className?: string }>> = {
  quick_post: MessageSquare,
  article: FileText,
  question: HelpCircle,
  poll: BarChart3,
  event_announcement: Calendar,
};

const TONES: Record<PostType, string> = {
  quick_post: "bg-muted text-muted-foreground",
  article: "bg-primary/10 text-primary",
  question: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  poll: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  event_announcement: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
};

export function PostTypePill({ type, className }: { type: PostType; className?: string }) {
  const Icon = ICONS[type] ?? MessageSquare;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5", TONES[type], className)}>
      <Icon className="size-3" />
      {POST_TYPE_LABELS[type]}
    </span>
  );
}
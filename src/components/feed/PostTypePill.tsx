import { cn } from "@/lib/utils";
import { POST_TYPE_LABELS, type PostType } from "@/lib/feed";
import { MessageSquare, FileText, HelpCircle, Calendar } from "lucide-react";

const ICONS = {
  quick_post: MessageSquare,
  article: FileText,
  question_placeholder: HelpCircle,
  event_announcement_placeholder: Calendar,
} as const;

const TONES: Record<PostType, string> = {
  quick_post: "bg-muted text-muted-foreground",
  article: "bg-primary/10 text-primary",
  question_placeholder: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  event_announcement_placeholder: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
};

export function PostTypePill({ type, className }: { type: PostType; className?: string }) {
  const Icon = ICONS[type];
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5", TONES[type], className)}>
      <Icon className="size-3" />
      {POST_TYPE_LABELS[type]}
    </span>
  );
}
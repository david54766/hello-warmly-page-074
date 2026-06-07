import { Link } from "@tanstack/react-router";
import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";

export function HashtagPill({
  name,
  className,
  asLink = true,
  size = "sm",
}: {
  name: string;
  className?: string;
  asLink?: boolean;
  size?: "sm" | "xs";
}) {
  const cls = cn(
    "inline-flex items-center gap-1 rounded-full font-medium transition-colors",
    size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5",
    "bg-primary/10 text-primary hover:bg-primary/20",
    className,
  );
  const content = (
    <>
      <Hash className={size === "xs" ? "size-2.5" : "size-3"} />
      {name}
    </>
  );
  if (!asLink) return <span className={cls}>{content}</span>;
  return (
    <Link to="/hashtags/$tag" params={{ tag: name }} className={cls}>
      {content}
    </Link>
  );
}

export function HashtagList({ tags, className }: { tags: string[]; className?: string }) {
  if (!tags.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((t) => <HashtagPill key={t} name={t} />)}
    </div>
  );
}
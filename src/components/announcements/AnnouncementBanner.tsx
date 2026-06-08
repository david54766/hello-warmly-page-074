import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listMyAnnouncements, listMyDismissedIds, recordView, type AdminAnnouncement } from "@/lib/announcements";
import { useAuth } from "@/hooks/useAuth";

export function AnnouncementBanner() {
  const { user } = useAuth();
  const [items, setItems] = useState<AdminAnnouncement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [list, d] = await Promise.all([listMyAnnouncements(), listMyDismissedIds()]);
      setItems(list.filter((a) => a.display_type === "banner"));
      setDismissed(new Set(d));
    })();
  }, [user?.id]);

  const visible = items.filter((a) => a.pinned || !dismissed.has(a.id));
  if (!visible.length) return null;

  const dismiss = async (id: string) => {
    setDismissed((s) => new Set(s).add(id));
    await recordView(id, true);
  };

  return (
    <div className="space-y-2">
      {visible.slice(0, 3).map((a) => (
        <div key={a.id} className="rounded-xl border bg-primary/5 px-4 py-3 flex items-start gap-3">
          <Megaphone className="size-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{a.title} {a.pinned && <span className="text-amber-600 ml-1">📌</span>}</p>
            {a.body && <p className="text-sm text-muted-foreground line-clamp-2">{a.body}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" variant="ghost" asChild>
              <Link to="/announcements/$announcementId" params={{ announcementId: a.id }} onClick={() => recordView(a.id, false)}>View</Link>
            </Button>
            {!a.pinned && (
              <Button size="sm" variant="ghost" onClick={() => dismiss(a.id)} aria-label="Dismiss">
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
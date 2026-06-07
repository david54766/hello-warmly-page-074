import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { isSaved, toggleSaved, type SavedTargetType } from "@/lib/onboarding";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SaveButton({
  targetType,
  targetId,
  variant = "icon",
  className,
}: {
  targetType: SavedTargetType;
  targetId: string;
  variant?: "icon" | "button";
  className?: string;
}) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    isSaved(user.id, targetType, targetId).then(setSaved);
  }, [user, targetType, targetId]);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setBusy(true);
    try {
      const next = await toggleSaved(user.id, targetType, targetId);
      setSaved(next);
      toast.success(next ? "Saved" : "Removed from saved");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not update saved item");
    } finally {
      setBusy(false);
    }
  };

  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-8", className)}
        onClick={onClick}
        disabled={busy}
        aria-label={saved ? "Remove from saved" : "Save"}
        title={saved ? "Remove from saved" : "Save"}
      >
        {saved ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />}
      </Button>
    );
  }
  return (
    <Button
      type="button"
      variant={saved ? "default" : "outline"}
      size="sm"
      className={className}
      onClick={onClick}
      disabled={busy}
    >
      {saved ? <><BookmarkCheck className="size-4 mr-1.5" />Saved</> : <><Bookmark className="size-4 mr-1.5" />Save</>}
    </Button>
  );
}
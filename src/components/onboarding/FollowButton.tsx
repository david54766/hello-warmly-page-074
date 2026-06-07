import { useEffect, useState } from "react";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { followUser, isFollowing, unfollowUser } from "@/lib/onboarding";
import { toast } from "sonner";

export function FollowButton({
  userId,
  size = "sm",
  variant,
  onChange,
  className,
}: {
  userId: string;
  size?: "sm" | "default";
  variant?: "default" | "outline";
  onChange?: (following: boolean) => void;
  className?: string;
}) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || user.id === userId) return;
    isFollowing(user.id, userId).then(setFollowing);
  }, [user, userId]);

  if (!user || user.id === userId) return null;

  const click = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    try {
      if (following) {
        await unfollowUser(user.id, userId);
        setFollowing(false);
        onChange?.(false);
        toast.success("Unfollowed");
      } else {
        await followUser(user.id, userId);
        setFollowing(true);
        onChange?.(true);
        toast.success("Following");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Could not update follow");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={click}
      disabled={busy}
      size={size}
      variant={variant ?? (following ? "outline" : "default")}
      className={className}
    >
      {busy ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : following ? <UserCheck className="size-4 mr-1.5" /> : <UserPlus className="size-4 mr-1.5" />}
      {following ? "Following" : "Follow"}
    </Button>
  );
}
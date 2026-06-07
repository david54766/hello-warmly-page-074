import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { canJoin, type Space } from "@/lib/spaces";

export function JoinSpaceButton({
  space,
  isMember,
  onChange,
  size = "default",
}: {
  space: Pick<Space, "id" | "access_level" | "privacy_level" | "is_archived">;
  isMember: boolean;
  onChange?: () => void;
  size?: "default" | "sm" | "lg";
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!canJoin(space) && !isMember) {
    return (
      <Button size={size} variant="secondary" disabled className="flex-1">
        <Lock className="size-3.5 mr-1.5" />
        {space.access_level === "paid_placeholder" ? "Coming soon" : "Locked"}
      </Button>
    );
  }

  const toggle = async () => {
    if (!user) return;
    setBusy(true);
    if (isMember) {
      const { error } = await supabase.from("space_members").delete().eq("space_id", space.id).eq("user_id", user.id);
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Left the Space");
      onChange?.();
    } else {
      const { error } = await supabase.from("space_members").insert({ space_id: space.id, user_id: user.id });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Joined the Space");
      onChange?.();
    }
  };

  return (
    <Button size={size} variant={isMember ? "outline" : "default"} onClick={toggle} disabled={busy} className="flex-1">
      {busy && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
      {isMember ? "Leave" : "Join"}
    </Button>
  );
}
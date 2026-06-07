import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getOrCreateDirect } from "@/lib/chat";
import { toast } from "sonner";

export function MessageMemberButton({
  memberId,
  variant = "outline",
  size = "sm",
  className,
}: {
  memberId: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  if (!user || user.id === memberId) return null;

  const onClick = async () => {
    setBusy(true);
    try {
      const id = await getOrCreateDirect(user.id, memberId);
      navigate({ to: "/chat", search: { c: id } });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to start chat");
    } finally { setBusy(false); }
  };

  return (
    <Button onClick={onClick} variant={variant} size={size} disabled={busy} className={className}>
      {busy ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <MessageSquare className="size-4 mr-1.5" />}
      Message
    </Button>
  );
}
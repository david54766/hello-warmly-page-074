import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { totalUnread } from "@/lib/chat";
import { cn } from "@/lib/utils";

export function UnreadChatBadge({ className }: { className?: string }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const refresh = async () => {
      try {
        const n = await totalUnread(user.id);
        if (active) setCount(n);
      } catch { /* ignore */ }
    };
    refresh();
    const channel = supabase
      .channel(`unread:${user.id}:${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversation_members", filter: `user_id=eq.${user.id}` }, refresh)
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [user]);

  if (count <= 0) return null;
  return (
    <span className={cn("inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium min-w-4 h-4 px-1", className)}>
      {count > 99 ? "99+" : count}
    </span>
  );
}
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createGroup, getOrCreateDirect, initials } from "@/lib/chat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Profile = { id: string; full_name: string | null; email: string | null; avatar_url: string | null };

export function NewConversationModal({
  open,
  onOpenChange,
  currentUserId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentUserId: string;
  onCreated: (conversationId: string) => void;
}) {
  const [members, setMembers] = useState<Profile[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("direct");

  useEffect(() => {
    if (!open) return;
    setQuery(""); setSelected(new Set()); setTitle(""); setTab("direct");
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,email,avatar_url")
        .neq("id", currentUserId)
        .eq("status", "active")
        .order("full_name");
      setMembers((data ?? []) as Profile[]);
    })();
  }, [open, currentUserId]);

  const filtered = members.filter((m) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (m.full_name ?? "").toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q);
  });

  const toggle = (id: string, single = false) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (single) { next.clear(); next.add(id); return next; }
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const create = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return toast.error("Select at least one member");
    setBusy(true);
    try {
      const convId = tab === "direct"
        ? await getOrCreateDirect(currentUserId, ids[0])
        : await createGroup(currentUserId, ids, title);
      onCreated(convId);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New message</DialogTitle></DialogHeader>
        <Tabs value={tab} onValueChange={(v) => { setTab(v); setSelected(new Set()); }}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="direct">Direct</TabsTrigger>
            <TabsTrigger value="group">Group</TabsTrigger>
          </TabsList>
          <TabsContent value="direct" className="space-y-3 pt-3">
            <Input placeholder="Search members…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <MemberList items={filtered} selected={selected} onToggle={(id) => toggle(id, true)} />
          </TabsContent>
          <TabsContent value="group" className="space-y-3 pt-3">
            <Input placeholder="Group title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Search members…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <MemberList items={filtered} selected={selected} onToggle={(id) => toggle(id)} />
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={create} disabled={busy || selected.size === 0}>
            {busy && <Loader2 className="size-4 mr-1.5 animate-spin" />}
            {tab === "direct" ? "Start chat" : `Create group (${selected.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MemberList({ items, selected, onToggle }: { items: Profile[]; selected: Set<string>; onToggle: (id: string) => void }) {
  return (
    <ul className="max-h-72 overflow-y-auto rounded-lg border divide-y">
      {items.length === 0 && <li className="p-4 text-sm text-muted-foreground text-center">No members found</li>}
      {items.map((m) => {
        const active = selected.has(m.id);
        const name = m.full_name || m.email || "Member";
        return (
          <li key={m.id}>
            <button
              onClick={() => onToggle(m.id)}
              className={cn("flex items-center gap-3 w-full p-3 hover:bg-accent text-left", active && "bg-accent")}
            >
              <Avatar className="size-9"><AvatarImage src={m.avatar_url || undefined} /><AvatarFallback>{initials(m.full_name, m.email)}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{name}</p>
                {m.email && <p className="text-xs text-muted-foreground truncate">{m.email}</p>}
              </div>
              {active && <Check className="size-4 text-primary" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
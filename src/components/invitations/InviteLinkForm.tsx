import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { createInviteLink, type AppRole } from "@/lib/invitations";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function InviteLinkForm({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [role, setRole] = useState<AppRole>("member");
  const [spaceId, setSpaceId] = useState("__none__");
  const [maxUses, setMaxUses] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState("");
  const [spaces, setSpaces] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("spaces").select("id,name").eq("is_archived", false).order("name").then(({ data }) => setSpaces((data as any) ?? []));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSubmitting(true);
    try {
      await createInviteLink({
        name: name.trim(), role,
        space_id: spaceId === "__none__" ? null : spaceId,
        max_uses: maxUses ? Number(maxUses) : null,
        expires_at: expiresAt || null,
      }, user.id);
      toast.success("Invite link created");
      setName(""); setMaxUses(""); setExpiresAt("");
      onCreated();
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    } finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Link name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VIP Onboarding" required />
        </div>
        <div className="space-y-1.5">
          <Label>Default role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="platform_admin">Platform Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Space (optional)</Label>
          <Select value={spaceId} onValueChange={setSpaceId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {spaces.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Max uses</Label>
          <Input type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Unlimited" />
        </div>
        <div className="space-y-1.5">
          <Label>Expires</Label>
          <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create Invite Link"}</Button>
    </form>
  );
}
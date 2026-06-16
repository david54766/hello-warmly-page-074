import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { createInvitation, buildInviteUrl, type AppRole } from "@/lib/invitations";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  role: z.enum(["platform_admin", "moderator", "member"]),
  space_id: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  personal_message: z.string().trim().max(500).nullable().optional(),
});

export function InviteMemberForm({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("member");
  const [spaceId, setSpaceId] = useState<string>("__none__");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [message, setMessage] = useState("");
  const [spaces, setSpaces] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("spaces").select("id,name").eq("is_archived", false).order("name").then(({ data }) => setSpaces((data as any) ?? []));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      email, role,
      space_id: spaceId === "__none__" ? null : spaceId,
      expires_at: expiresAt || null,
      personal_message: message || null,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    try {
      const inv = await createInvitation(parsed.data as any, user.id);
      const url = buildInviteUrl(inv.token);
      setCreatedUrl(url);
      toast.success("Invitation created");
      setEmail(""); setMessage("");
      onCreated();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create invitation");
    } finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
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
          <Label>Expires</Label>
          <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Personal message (placeholder)</Label>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} placeholder="Welcome to the community…" />
      </div>
      <Button type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send Invite"}</Button>

      {createdUrl && (
        <div className="rounded-xl border border-border bg-muted/40 p-3 flex items-center gap-2">
          <code className="flex-1 text-xs break-all">{createdUrl}</code>
          <Button type="button" size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(createdUrl); toast.success("Link copied"); }}>
            <Copy className="size-3.5 mr-1" />Copy
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Email delivery is a placeholder — share the invite link directly for now.</p>
    </form>
  );
}
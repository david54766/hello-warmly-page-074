import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { lookupToken, acceptInvitationToken, acceptInviteLinkToken } from "@/lib/invitations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MailCheck } from "lucide-react";

export const Route = createFileRoute("/invite/$token")({
  component: InviteAcceptancePage,
});

function InviteAcceptancePage() {
  const { token } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<{ loading: boolean; kind: "invitation" | "invite_link" | "none"; data: any }>({
    loading: true, kind: "none", data: null,
  });
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    lookupToken(token).then((r) => setState({ loading: false, ...r }));
  }, [token]);

  async function accept() {
    if (!user) { navigate({ to: "/auth", search: { redirect: `/invite/${token}` } as any }); return; }
    setAccepting(true);
    try {
      const fn = state.kind === "invitation" ? acceptInvitationToken : acceptInviteLinkToken;
      const result: any = await fn(token);
      if (!result?.ok) { toast.error(result?.error ?? "Could not accept"); return; }
      toast.success("Welcome aboard!");
      if (result.space_id) navigate({ to: "/spaces/$spaceId", params: { spaceId: result.space_id } });
      else navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to accept invite");
    } finally { setAccepting(false); }
  }

  if (state.loading || authLoading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  if (state.kind === "none") {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <Card className="max-w-md w-full"><CardContent className="pt-6 text-center space-y-3">
          <h1 className="text-xl font-semibold">Invitation not found</h1>
          <p className="text-sm text-muted-foreground">This invite link is invalid or has been removed.</p>
          <Button asChild><Link to="/">Go home</Link></Button>
        </CardContent></Card>
      </div>
    );
  }

  const d = state.data;
  const expired = d.expires_at && new Date(d.expires_at) < new Date();
  const unavailable = state.kind === "invitation"
    ? d.status !== "pending" || expired
    : !d.active || expired || (d.max_uses && d.uses_count >= d.max_uses);

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-muted/30">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 space-y-5 text-center">
          <div className="size-12 rounded-full bg-primary/10 grid place-items-center mx-auto text-primary">
            <MailCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">You've been invited.</h1>
            <p className="text-sm text-muted-foreground mt-1">Create your account or log in to join the community.</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-sm text-left space-y-1">
            {state.kind === "invitation" && <div><span className="text-muted-foreground">Email:</span> {d.email}</div>}
            {state.kind === "invite_link" && <div><span className="text-muted-foreground">Link:</span> {d.name}</div>}
            <div><span className="text-muted-foreground">Role:</span> <span className="capitalize">{d.role.replace("_"," ")}</span></div>
            {d.space_name && <div><span className="text-muted-foreground">Space:</span> {d.space_name}</div>}
            {d.personal_message && <div className="pt-2 border-t border-border italic text-muted-foreground">"{d.personal_message}"</div>}
          </div>

          {unavailable ? (
            <p className="text-sm text-destructive">This invite is no longer available.</p>
          ) : user ? (
            <Button className="w-full" onClick={accept} disabled={accepting}>
              {accepting ? "Joining…" : "Accept Invitation"}
            </Button>
          ) : (
            <div className="space-y-2">
              <Button asChild className="w-full"><Link to="/auth" search={{ redirect: `/invite/${token}` } as any}>Sign up or log in</Link></Button>
              <p className="text-xs text-muted-foreground">You'll return here automatically to accept.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
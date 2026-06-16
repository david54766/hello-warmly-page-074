import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchInvitations, fetchInviteLinks, type Invitation, type InviteLink } from "@/lib/invitations";
import { InviteMemberForm } from "@/components/invitations/InviteMemberForm";
import { AdminInvitationTable } from "@/components/invitations/AdminInvitationTable";
import { InviteLinkForm } from "@/components/invitations/InviteLinkForm";
import { InviteLinkTable } from "@/components/invitations/InviteLinkTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/invitations")({
  component: AdminInvitationsPage,
});

function AdminInvitationsPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [invs, setInvs] = useState<Invitation[]>([]);
  const [links, setLinks] = useState<InviteLink[]>([]);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);

  async function refresh() {
    setInvs(await fetchInvitations());
    setLinks(await fetchInviteLinks());
  }
  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Invitations</h1>
        <p className="text-muted-foreground mt-1">Invite new members and send them directly into the right role or Space.</p>
      </header>

      <Tabs defaultValue="invites">
        <TabsList>
          <TabsTrigger value="invites">Email Invites</TabsTrigger>
          <TabsTrigger value="links">Invite Links</TabsTrigger>
        </TabsList>
        <TabsContent value="invites" className="space-y-6">
          <Card><CardHeader><CardTitle className="text-lg">Invite by email</CardTitle></CardHeader>
            <CardContent><InviteMemberForm onCreated={refresh} /></CardContent>
          </Card>
          <Card><CardHeader><CardTitle className="text-lg">All invitations</CardTitle></CardHeader>
            <CardContent><AdminInvitationTable items={invs} onChange={refresh} /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="links" className="space-y-6">
          <Card><CardHeader><CardTitle className="text-lg">Create invite link</CardTitle></CardHeader>
            <CardContent><InviteLinkForm onCreated={refresh} /></CardContent>
          </Card>
          <Card><CardHeader><CardTitle className="text-lg">All invite links</CardTitle></CardHeader>
            <CardContent><InviteLinkTable items={links} onChange={refresh} /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
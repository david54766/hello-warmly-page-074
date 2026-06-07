import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ProfileEditForm } from "@/components/members/ProfileEditForm";
import type { MemberProfile } from "@/lib/members";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, user, refresh } = useAuth();

  return (
    <div className="max-w-3xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage how you appear in the community.</p>
        </div>
        {user && (
          <Button variant="outline" asChild>
            <Link to="/members/$userId" params={{ userId: user.id }}>View public profile</Link>
          </Button>
        )}
      </header>

      {user && (
        <ProfileEditForm
          profile={profile as unknown as MemberProfile | null}
          userId={user.id}
          email={user.email ?? null}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
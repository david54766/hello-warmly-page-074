import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusPill } from "@/components/app/DashboardCard";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, user, roles, refresh } = useAuth();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
    setBio(profile?.bio ?? "");
    setLocation(profile?.location ?? "");
  }, [profile]);

  const onSave = async () => {
    if (!user) return;
    if (!fullName.trim()) return toast.error("Full name is required");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), avatar_url: avatarUrl || null, bio: bio || null, location: location || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    await refresh();
  };

  const initials = (fullName || user?.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage how you appear in the community.</p>
      </header>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input id="avatar" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="loc">Location</Label>
            <Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <div className="h-9 flex items-center gap-2">
                {roles.length === 0 && <StatusPill label="member" />}
                {roles.map((r) => (
                  <StatusPill key={r} label={r.replace("_", " ")} tone={r === "platform_admin" ? "info" : "neutral"} />
                ))}
              </div>
            </div>
          </div>
          <div className="pt-2">
            <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
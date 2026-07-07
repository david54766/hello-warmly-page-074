import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user, profile, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setAvatar(profile.avatar_url ?? "");
      setBio(profile.bio ?? "");
      setLocation(profile.location ?? "");
      if (profile.onboarding_completed) navigate({ to: "/dashboard" });
    }
  }, [profile, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) return toast.error("Please enter your name");
    setSaving(true);
    // Upsert (not update): if the handle_new_user trigger didn't create the
    // profile row, this creates it — RLS allows inserting your own row.
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: name.trim(),
      avatar_url: avatar || null,
      bio: bio || null,
      location: location || null,
      onboarding_completed: true,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome aboard!");
    await refresh();
    navigate({ to: "/dashboard" });
  };

  if (loading || !user) {
    return <div className="min-h-screen p-8 max-w-xl mx-auto space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64" /></div>;
  }

  const initials = (name || user.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10 bg-gradient-to-br from-background to-accent/30">
      <Card className="w-full max-w-xl rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Let's personalize your community experience.</CardTitle>
          <CardDescription>Complete your profile so other members can get to know you.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="size-16"><AvatarImage src={avatar || undefined} /><AvatarFallback>{initials}</AvatarFallback></Avatar>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="ob-avatar">Avatar URL</Label>
                <Input id="ob-avatar" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-name">Full name</Label>
              <Input id="ob-name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-bio">Bio</Label>
              <Textarea id="ob-bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short intro..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-loc">Location</Label>
              <Input id="ob-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving..." : "Complete profile"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { memberInitials, type MemberProfile } from "@/lib/members";

type FormState = {
  full_name: string;
  headline: string;
  bio: string;
  location: string;
  avatar_url: string;
  cover_image_url: string;
  website_url: string;
  twitter: string;
  linkedin: string;
  github: string;
};

export function ProfileEditForm({ profile, userId, email, onSaved }: { profile: MemberProfile | null; userId: string; email: string | null; onSaved?: () => void }) {
  const [state, setState] = useState<FormState>({
    full_name: "", headline: "", bio: "", location: "", avatar_url: "", cover_image_url: "", website_url: "",
    twitter: "", linkedin: "", github: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const social = (profile.social_links_json ?? {}) as Record<string, string>;
    setState({
      full_name: profile.full_name ?? "",
      headline: profile.headline ?? "",
      bio: profile.bio ?? "",
      location: profile.location ?? "",
      avatar_url: profile.avatar_url ?? "",
      cover_image_url: profile.cover_image_url ?? "",
      website_url: profile.website_url ?? "",
      twitter: social.twitter ?? "",
      linkedin: social.linkedin ?? "",
      github: social.github ?? "",
    });
  }, [profile]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setState((s) => ({ ...s, [k]: v }));

  const save = async () => {
    if (!state.full_name.trim()) return toast.error("Full name is required");
    setSaving(true);
    const social_links_json: Record<string, string> = {};
    if (state.twitter) social_links_json.twitter = state.twitter;
    if (state.linkedin) social_links_json.linkedin = state.linkedin;
    if (state.github) social_links_json.github = state.github;
    const { error } = await supabase.from("profiles").update({
      full_name: state.full_name.trim(),
      headline: state.headline || null,
      bio: state.bio || null,
      location: state.location || null,
      avatar_url: state.avatar_url || null,
      cover_image_url: state.cover_image_url || null,
      website_url: state.website_url || null,
      social_links_json,
    }).eq("id", userId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    onSaved?.();
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Profile details</CardTitle>
        <Button asChild variant="outline" size="sm"><Link to="/settings"><Bell className="size-4 mr-1.5" />Notification preferences</Link></Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div
          className="rounded-xl h-28 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border"
          style={state.cover_image_url ? { backgroundImage: `url(${state.cover_image_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1"><Label>Cover image URL</Label><Input value={state.cover_image_url} onChange={(e) => set("cover_image_url", e.target.value)} placeholder="https://…" /></div>
          <div className="space-y-1"><Label>Avatar URL</Label><Input value={state.avatar_url} onChange={(e) => set("avatar_url", e.target.value)} placeholder="https://…" /></div>
        </div>

        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarImage src={state.avatar_url || undefined} />
            <AvatarFallback>{memberInitials(state.full_name, email)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1"><Label>Full name</Label><Input value={state.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
        </div>

        <div className="space-y-1"><Label>Headline</Label><Input placeholder="e.g. Community builder, indie maker" value={state.headline} onChange={(e) => set("headline", e.target.value)} /></div>
        <div className="space-y-1"><Label>Bio</Label><Textarea rows={4} value={state.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Tell other members a bit about yourself." /></div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1"><Label>Location</Label><Input value={state.location} onChange={(e) => set("location", e.target.value)} placeholder="City, Country" /></div>
          <div className="space-y-1"><Label>Website URL</Label><Input value={state.website_url} onChange={(e) => set("website_url", e.target.value)} placeholder="https://…" /></div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1"><Label>Twitter / X</Label><Input value={state.twitter} onChange={(e) => set("twitter", e.target.value)} placeholder="https://x.com/handle" /></div>
          <div className="space-y-1"><Label>LinkedIn</Label><Input value={state.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/…" /></div>
          <div className="space-y-1"><Label>GitHub</Label><Input value={state.github} onChange={(e) => set("github", e.target.value)} placeholder="https://github.com/…" /></div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1"><Label>Email</Label><Input value={email ?? ""} disabled /></div>
        </div>

        <div className="pt-2"><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button></div>
      </CardContent>
    </Card>
  );
}
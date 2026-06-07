import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/DashboardCard";
import { PostTypePill } from "@/components/feed/PostTypePill";
import { Pin, Star, EyeOff, Eye, Trash2, MessageSquare, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Post } from "@/lib/feed";
import type { Space } from "@/lib/spaces";

export const Route = createFileRoute("/_authenticated/admin/posts")({
  component: AdminPostsPage,
});

function AdminPostsPage() {
  const { isAdmin, roles, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMod = isAdmin || roles.includes("moderator");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [search, setSearch] = useState("");
  const [spaceFilter, setSpaceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");

  useEffect(() => { if (!authLoading && !isMod) navigate({ to: "/dashboard" }); }, [authLoading, isMod, navigate]);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("spaces").select("*").order("sort_order"),
    ]);
    setPosts((p ?? []) as Post[]);
    setSpaces((s ?? []) as Space[]);
    setLoading(false);
  };
  useEffect(() => { if (isMod) load(); }, [isMod]);

  const spacesById = useMemo(() => new Map(spaces.map((s) => [s.id, s])), [spaces]);
  const filtered = useMemo(() => {
    let arr = posts;
    if (spaceFilter !== "all") arr = arr.filter((p) => p.space_id === spaceFilter);
    if (statusFilter !== "all") arr = arr.filter((p) => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((p) => (p.title?.toLowerCase().includes(q) ?? false) || p.body.toLowerCase().includes(q));
    }
    return arr;
  }, [posts, spaceFilter, statusFilter, search]);

  if (!isMod) return null;

  const update = async (id: string, patch: Partial<Post>, msg: string) => {
    const { error } = await supabase.from("posts").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(msg);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Post deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Posts</h1>
        <p className="text-muted-foreground mt-1">Moderate, pin, and feature posts across every Space.</p>
      </header>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts…" maxLength={100} />
        </div>
        <Select value={spaceFilter} onValueChange={setSpaceFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Spaces</SelectItem>
            {spaces.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<MessageSquare className="size-5" />} title="No posts match" description="Try a different filter." />
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => (
            <li key={p.id}>
              <Card className="rounded-2xl">
                <CardContent className="pt-5 flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <PostTypePill type={p.post_type} />
                      {p.is_pinned && <span className="text-[11px] rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5">Pinned</span>}
                      {p.is_featured && <span className="text-[11px] rounded-full bg-primary/10 text-primary px-2 py-0.5">Featured</span>}
                      {p.status === "hidden" && <span className="text-[11px] rounded-full bg-muted text-muted-foreground px-2 py-0.5">Hidden</span>}
                      <span className="text-xs text-muted-foreground">{spacesById.get(p.space_id)?.name ?? "—"}</span>
                    </div>
                    <p className="font-medium truncate mt-1">{p.title || p.body.slice(0, 80) || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button variant="ghost" size="icon" asChild><Link to="/posts/$postId" params={{ postId: p.id }}><ExternalLink className="size-4" /></Link></Button>
                    {isAdmin && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => update(p.id, { is_pinned: !p.is_pinned }, p.is_pinned ? "Unpinned" : "Pinned")}><Pin className="size-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => update(p.id, { is_featured: !p.is_featured }, p.is_featured ? "Unfeatured" : "Featured")}><Star className="size-4" /></Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => update(p.id, { status: p.status === "hidden" ? "active" : "hidden" }, p.status === "hidden" ? "Restored" : "Hidden")}>
                      {p.status === "hidden" ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </Button>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="size-4" /></Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
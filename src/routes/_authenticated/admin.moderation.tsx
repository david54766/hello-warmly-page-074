import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/DashboardCard";
import { Shield, EyeOff, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Report } from "@/lib/feed";

export const Route = createFileRoute("/_authenticated/admin/moderation")({
  component: ModerationPage,
});

function ModerationPage() {
  const { isAdmin, roles, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMod = isAdmin || roles.includes("moderator");
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [postTitles, setPostTitles] = useState<Map<string, { id: string; title: string }>>(new Map());
  const [commentBodies, setCommentBodies] = useState<Map<string, { id: string; post_id: string; body: string }>>(new Map());
  const [reporters, setReporters] = useState<Map<string, string>>(new Map());

  useEffect(() => { if (!authLoading && !isMod) navigate({ to: "/dashboard" }); }, [authLoading, isMod, navigate]);

  const load = async () => {
    setLoading(true);
    const { data: rs } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(200);
    const r = (rs ?? []) as Report[];
    setReports(r);

    const postIds = r.filter((x) => x.target_type === "post").map((x) => x.target_id);
    const commentIds = r.filter((x) => x.target_type === "comment").map((x) => x.target_id);
    const reporterIds = Array.from(new Set(r.map((x) => x.reporter_id).filter((x): x is string => !!x)));

    const [postsRes, commentsRes, profsRes] = await Promise.all([
      postIds.length ? supabase.from("posts").select("id,title,body").in("id", postIds) : Promise.resolve({ data: [] as { id: string; title: string | null; body: string }[] }),
      commentIds.length ? supabase.from("comments").select("id,post_id,body").in("id", commentIds) : Promise.resolve({ data: [] as { id: string; post_id: string; body: string }[] }),
      reporterIds.length ? supabase.from("profiles").select("id,full_name,email").in("id", reporterIds) : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string | null }[] }),
    ]);
    setPostTitles(new Map((postsRes.data ?? []).map((p) => [p.id, { id: p.id, title: p.title || p.body.slice(0, 60) || "Untitled" }])));
    setCommentBodies(new Map((commentsRes.data ?? []).map((c) => [c.id, c])));
    setReporters(new Map((profsRes.data ?? []).map((p) => [p.id, p.full_name || p.email || "Member"])));
    setLoading(false);
  };
  useEffect(() => { if (isMod) load(); }, [isMod]);

  const resolve = async (r: Report, status: "resolved" | "dismissed") => {
    const { error } = await supabase.from("reports").update({
      status, reviewed_by: user?.id ?? null, reviewed_at: new Date().toISOString(),
    }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(`Report ${status}`);
    load();
  };

  const hideTarget = async (r: Report) => {
    const table = r.target_type === "post" ? "posts" : "comments";
    const { error } = await supabase.from(table).update({ status: "hidden" }).eq("id", r.target_id);
    if (error) return toast.error(error.message);
    await resolve(r, "resolved");
  };

  const pending = useMemo(() => reports.filter((r) => r.status === "pending"), [reports]);
  const reviewed = useMemo(() => reports.filter((r) => r.status !== "pending"), [reports]);

  if (!isMod) return null;

  const renderList = (list: Report[]) => list.length === 0 ? (
    <EmptyState icon={<Shield className="size-5" />} title="Nothing to review" description="Reports will appear here as they come in." />
  ) : (
    <ul className="space-y-2">
      {list.map((r) => {
        const isPost = r.target_type === "post";
        const post = isPost ? postTitles.get(r.target_id) : null;
        const comment = !isPost ? commentBodies.get(r.target_id) : null;
        const link = isPost
          ? (post ? { to: "/posts/$postId" as const, params: { postId: post.id } } : null)
          : (comment ? { to: "/posts/$postId" as const, params: { postId: comment.post_id } } : null);
        return (
          <li key={r.id}>
            <Card className="rounded-2xl">
              <CardContent className="pt-5 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium uppercase tracking-wide">{r.target_type}</span>
                  <span>·</span>
                  <span>{new Date(r.created_at).toLocaleString()}</span>
                  <span>·</span>
                  <span>by {reporters.get(r.reporter_id ?? "") ?? "Anonymous"}</span>
                </div>
                <p className="text-sm"><span className="font-medium">Reason:</span> {r.reason}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {isPost ? (post?.title ?? "Content unavailable") : (comment?.body ?? "Content unavailable")}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {link && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={link.to} params={link.params}><ExternalLink className="size-4 mr-1.5" />View</Link>
                    </Button>
                  )}
                  {r.status === "pending" && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => hideTarget(r)}>
                        <EyeOff className="size-4 mr-1.5" />Hide content
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => resolve(r, "resolved")}>
                        <CheckCircle2 className="size-4 mr-1.5" />Resolve
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => resolve(r, "dismissed")}>
                        <XCircle className="size-4 mr-1.5" />Dismiss
                      </Button>
                    </>
                  )}
                  {r.status !== "pending" && (
                    <span className="text-xs text-muted-foreground capitalize">{r.status}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Moderation</h1>
        <p className="text-muted-foreground mt-1">Review reported posts and comments.</p>
      </header>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed ({reviewed.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="pt-4">{renderList(pending)}</TabsContent>
          <TabsContent value="reviewed" className="pt-4">{renderList(reviewed)}</TabsContent>
        </Tabs>
      )}
    </div>
  );
}
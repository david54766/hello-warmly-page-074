import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, StatusPill } from "@/components/app/DashboardCard";
import { Shield, EyeOff, CheckCircle2, XCircle, ExternalLink, Eye, NotebookPen } from "lucide-react";
import { toast } from "sonner";
import { ContentFlagTable } from "@/components/moderation/ContentFlagTable";
import { UserWarningsTable } from "@/components/moderation/UserWarningsTable";

export const Route = createFileRoute("/_authenticated/admin/moderation")({
  component: ModerationPage,
});

type ReportStatus = "open" | "under_review" | "resolved" | "dismissed" | "pending";
type ReportTarget = "post" | "comment" | "user" | "event" | "course" | "lesson" | "message";
type Report = {
  id: string;
  reporter_id: string | null;
  target_type: ReportTarget;
  target_id: string;
  reason: string;
  status: ReportStatus;
  moderator_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

function ModerationPage() {
  const { isAdmin, roles, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMod = isAdmin || roles.includes("moderator");
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [postTitles, setPostTitles] = useState<Map<string, { id: string; title: string }>>(new Map());
  const [commentBodies, setCommentBodies] = useState<Map<string, { id: string; post_id: string; body: string }>>(new Map());
  const [messageBodies, setMessageBodies] = useState<Map<string, { id: string; conversation_id: string; body: string; status: string }>>(new Map());
  const [reporters, setReporters] = useState<Map<string, string>>(new Map());
  const [targetNames, setTargetNames] = useState<Map<string, string>>(new Map());
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  useEffect(() => { if (!authLoading && !isMod) navigate({ to: "/dashboard" }); }, [authLoading, isMod, navigate]);

  const load = async () => {
    setLoading(true);
    const { data: rs } = await (supabase as any).from("reports").select("*").order("created_at", { ascending: false }).limit(200);
    const r = (rs ?? []) as Report[];
    setReports(r);

    const ids = (t: ReportTarget) => r.filter((x) => x.target_type === t).map((x) => x.target_id);
    const postIds = ids("post"), commentIds = ids("comment"), userIds = ids("user"), messageIds = ids("message");
    const eventIds = ids("event"), courseIds = ids("course"), lessonIds = ids("lesson");
    const reporterIds = Array.from(new Set(r.map((x) => x.reporter_id).filter((x): x is string => !!x)));
    const sb: any = supabase;

    const [postsRes, commentsRes, profsRes, usersRes, eventsRes, coursesRes, lessonsRes, messagesRes] = await Promise.all([
      postIds.length ? supabase.from("posts").select("id,title,body").in("id", postIds) : Promise.resolve({ data: [] as any[] }),
      commentIds.length ? supabase.from("comments").select("id,post_id,body").in("id", commentIds) : Promise.resolve({ data: [] as any[] }),
      reporterIds.length ? supabase.from("profiles").select("id,full_name,email").in("id", reporterIds) : Promise.resolve({ data: [] as any[] }),
      userIds.length ? supabase.from("profiles").select("id,full_name,email").in("id", userIds) : Promise.resolve({ data: [] as any[] }),
      eventIds.length ? sb.from("events").select("id,title").in("id", eventIds) : Promise.resolve({ data: [] }),
      courseIds.length ? supabase.from("courses").select("id,title").in("id", courseIds) : Promise.resolve({ data: [] as any[] }),
      lessonIds.length ? supabase.from("lessons").select("id,title").in("id", lessonIds) : Promise.resolve({ data: [] as any[] }),
      messageIds.length ? sb.from("messages").select("id,conversation_id,body,status").in("id", messageIds) : Promise.resolve({ data: [] }),
    ]);

    setPostTitles(new Map((postsRes.data ?? []).map((p: any) => [p.id, { id: p.id, title: p.title || p.body.slice(0, 60) || "Untitled" }])));
    setCommentBodies(new Map((commentsRes.data ?? []).map((c: any) => [c.id, c])));
    setMessageBodies(new Map((messagesRes.data ?? []).map((m: any) => [m.id, m])));
    setReporters(new Map((profsRes.data ?? []).map((p: any) => [p.id, p.full_name || p.email || "Member"])));
    const names = new Map<string, string>();
    (usersRes.data ?? []).forEach((p: any) => names.set(p.id, p.full_name || p.email || "Member"));
    (eventsRes.data ?? []).forEach((e: any) => names.set(e.id, e.title));
    (coursesRes.data ?? []).forEach((c: any) => names.set(c.id, c.title));
    (lessonsRes.data ?? []).forEach((l: any) => names.set(l.id, l.title));
    setTargetNames(names);
    setNotesDraft(Object.fromEntries(r.map((x) => [x.id, x.moderator_notes ?? ""])));
    setLoading(false);
  };
  useEffect(() => { if (isMod) load(); }, [isMod]);

  const updateStatus = async (r: Report, status: ReportStatus) => {
    const patch: any = { status };
    if (status === "resolved" || status === "dismissed") {
      patch.reviewed_by = user?.id ?? null;
      patch.reviewed_at = new Date().toISOString();
    }
    if (notesDraft[r.id] !== undefined) patch.moderator_notes = notesDraft[r.id] || null;
    const { error } = await (supabase as any).from("reports").update(patch).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(`Report ${status.replace("_", " ")}`);
    load();
  };

  const saveNotes = async (r: Report) => {
    const { error } = await (supabase as any).from("reports").update({ moderator_notes: notesDraft[r.id] || null }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Notes saved");
  };

  const hideTarget = async (r: Report) => {
    if (r.target_type !== "post" && r.target_type !== "comment" && r.target_type !== "message") {
      return toast.error("Hide is only available for posts, comments, and messages");
    }
    const table = r.target_type === "post" ? "posts" : r.target_type === "comment" ? "comments" : "messages";
    const { error } = await (supabase as any).from(table).update({ status: "hidden" }).eq("id", r.target_id);
    if (error) return toast.error(error.message);
    await updateStatus(r, "resolved");
  };

  const isOpen = (s: ReportStatus) => s === "open" || s === "pending";
  const open = useMemo(() => reports.filter((r) => isOpen(r.status)), [reports]);
  const underReview = useMemo(() => reports.filter((r) => r.status === "under_review"), [reports]);
  const resolved = useMemo(() => reports.filter((r) => r.status === "resolved"), [reports]);
  const dismissed = useMemo(() => reports.filter((r) => r.status === "dismissed"), [reports]);

  if (!isMod) return null;

  const statusTone = (s: ReportStatus): "success" | "neutral" | "warn" | "info" =>
    s === "resolved" ? "success" : s === "dismissed" ? "neutral" : s === "under_review" ? "warn" : "info";

  const targetLink = (r: Report): { to: any; params: any; label: string } | null => {
    if (r.target_type === "post") {
      const p = postTitles.get(r.target_id);
      return p ? { to: "/posts/$postId", params: { postId: p.id }, label: p.title } : null;
    }
    if (r.target_type === "comment") {
      const c = commentBodies.get(r.target_id);
      return c ? { to: "/posts/$postId", params: { postId: c.post_id }, label: c.body.slice(0, 80) } : null;
    }
    if (r.target_type === "user")
      return { to: "/members/$userId", params: { userId: r.target_id }, label: targetNames.get(r.target_id) ?? "Member" };
    if (r.target_type === "event")
      return { to: "/events/$eventId", params: { eventId: r.target_id }, label: targetNames.get(r.target_id) ?? "Event" };
    if (r.target_type === "course")
      return { to: "/courses/$courseId", params: { courseId: r.target_id }, label: targetNames.get(r.target_id) ?? "Course" };
    if (r.target_type === "lesson")
      return { to: "/lessons/$lessonId", params: { lessonId: r.target_id }, label: targetNames.get(r.target_id) ?? "Lesson" };
    if (r.target_type === "message") {
      const m = messageBodies.get(r.target_id);
      return m ? { to: "/chat", params: {}, label: (m.body || "").slice(0, 120) || "[empty message]" } : null;
    }
    return null;
  };

  const renderList = (list: Report[]) => list.length === 0 ? (
    <EmptyState icon={<Shield className="size-5" />} title="No reports need review right now." />
  ) : (
    <ul className="space-y-2">
      {list.map((r) => {
        const link = targetLink(r);
        const canHide = r.target_type === "post" || r.target_type === "comment" || r.target_type === "message";
        const isActive = isOpen(r.status) || r.status === "under_review";
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
                  <span>·</span>
                  <StatusPill label={r.status.replace("_", " ")} tone={statusTone(r.status)} />
                </div>
                <p className="text-sm"><span className="font-medium">Reason:</span> {r.reason}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {link?.label ?? "Content unavailable"}
                </p>
                <Textarea
                  value={notesDraft[r.id] ?? ""}
                  onChange={(e) => setNotesDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                  placeholder="Moderator notes (private)…"
                  className="min-h-16 text-sm"
                />
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {link && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={link.to} params={link.params}><ExternalLink className="size-4 mr-1.5" />View</Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => saveNotes(r)}>
                    <NotebookPen className="size-4 mr-1.5" />Save notes
                  </Button>
                  {isActive && (
                    <>
                      {r.status !== "under_review" && (
                        <Button variant="outline" size="sm" onClick={() => updateStatus(r, "under_review")}>
                          <Eye className="size-4 mr-1.5" />Mark under review
                        </Button>
                      )}
                      {canHide && (
                        <Button variant="outline" size="sm" onClick={() => hideTarget(r)}>
                          <EyeOff className="size-4 mr-1.5" />Hide content
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => updateStatus(r, "resolved")}>
                        <CheckCircle2 className="size-4 mr-1.5" />Mark resolved
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => updateStatus(r, "dismissed")}>
                        <XCircle className="size-4 mr-1.5" />Dismiss
                      </Button>
                    </>
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
        <h1 className="text-3xl font-semibold tracking-tight">Moderation Center</h1>
        <p className="text-muted-foreground mt-1">Review reports, manage flagged content, document concerns, and protect the quality of the community.</p>
      </header>
      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="flags">Content flags</TabsTrigger>
          <TabsTrigger value="warnings">Warnings</TabsTrigger>
        </TabsList>
        <TabsContent value="reports" className="pt-4">
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : (
        <Tabs defaultValue="open">
          <TabsList>
            <TabsTrigger value="open">Open ({open.length})</TabsTrigger>
            <TabsTrigger value="under_review">Under review ({underReview.length})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({resolved.length})</TabsTrigger>
            <TabsTrigger value="dismissed">Dismissed ({dismissed.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="open" className="pt-4">{renderList(open)}</TabsContent>
          <TabsContent value="under_review" className="pt-4">{renderList(underReview)}</TabsContent>
          <TabsContent value="resolved" className="pt-4">{renderList(resolved)}</TabsContent>
          <TabsContent value="dismissed" className="pt-4">{renderList(dismissed)}</TabsContent>
        </Tabs>
      )}
        </TabsContent>
        <TabsContent value="flags" className="pt-4">
          <ContentFlagTable />
        </TabsContent>
        <TabsContent value="warnings" className="pt-4">
          <UserWarningsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
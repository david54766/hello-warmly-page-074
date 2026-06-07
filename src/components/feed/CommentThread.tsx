import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Flag, Trash2, EyeOff, Eye, MessageSquareReply } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import { CommentForm } from "./CommentForm";
import { ReactionBar } from "./ReactionBar";
import { ReportModal } from "./ReportModal";
import { BestAnswerBadge } from "./BestAnswerBadge";
import { timeAgo, type Comment, type Reaction, type PostType } from "@/lib/feed";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { EmptyState } from "@/components/app/DashboardCard";
import { setBestAnswer, clearBestAnswer } from "@/lib/postExtras";

export interface CommentAuthor { id: string; full_name: string | null; email: string | null; avatar_url: string | null }

export function CommentThread({
  postId,
  comments,
  reactions,
  authors,
  onChange,
  postAuthorId = null,
  postType,
  bestAnswerCommentId = null,
}: {
  postId: string;
  comments: Comment[];
  reactions: Reaction[];
  authors: Map<string, CommentAuthor>;
  onChange: () => void;
  postAuthorId?: string | null;
  postType?: PostType;
  bestAnswerCommentId?: string | null;
}) {
  const roots = useMemo(() => comments.filter((c) => !c.parent_comment_id), [comments]);
  const childrenByParent = useMemo(() => {
    const m = new Map<string, Comment[]>();
    comments.filter((c) => c.parent_comment_id).forEach((c) => {
      const arr = m.get(c.parent_comment_id!) ?? [];
      arr.push(c);
      m.set(c.parent_comment_id!, arr);
    });
    return m;
  }, [comments]);

  return (
    <div className="space-y-4">
      <CommentForm postId={postId} onPosted={onChange} />
      {comments.length === 0 ? (
        <EmptyState title="No comments yet" description="Be the first to share your thoughts." />
      ) : (
        <ul className="space-y-4">
          {roots.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              authors={authors}
              reactions={reactions}
              childrenByParent={childrenByParent}
              postId={postId}
              onChange={onChange}
              depth={0}
              postAuthorId={postAuthorId}
              postType={postType}
              bestAnswerCommentId={bestAnswerCommentId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentItem({
  comment, authors, reactions, childrenByParent, postId, onChange, depth,
  postAuthorId, postType, bestAnswerCommentId,
}: {
  comment: Comment;
  authors: Map<string, CommentAuthor>;
  reactions: Reaction[];
  childrenByParent: Map<string, Comment[]>;
  postId: string;
  onChange: () => void;
  depth: number;
  postAuthorId?: string | null;
  postType?: PostType;
  bestAnswerCommentId?: string | null;
}) {
  const { user, isAdmin, roles } = useAuth();
  const isMod = isAdmin || roles.includes("moderator");
  const isAuthor = user?.id === comment.author_id;
  const canMarkBest = postType === "question" && depth === 0 && (user?.id === postAuthorId || isAdmin);
  const isBest = bestAnswerCommentId === comment.id;
  const [replying, setReplying] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const author = authors.get(comment.author_id ?? "");
  const name = author?.full_name || author?.email || "Member";
  const initials = name.slice(0, 2).toUpperCase();
  const children = childrenByParent.get(comment.id) ?? [];
  const cReactions = reactions.filter((r) => r.target_type === "comment" && r.target_id === comment.id);

  const remove = async () => {
    if (!confirm("Delete this comment?")) return;
    const { error } = await supabase.from("comments").delete().eq("id", comment.id);
    if (error) return toast.error(error.message);
    toast.success("Comment deleted");
    onChange();
  };
  const setStatus = async (status: "active" | "hidden") => {
    const { error } = await supabase.from("comments").update({ status }).eq("id", comment.id);
    if (error) return toast.error(error.message);
    toast.success(status === "hidden" ? "Hidden" : "Restored");
    onChange();
  };
  const toggleBest = async () => {
    const { error } = isBest ? await clearBestAnswer(postId) : await setBestAnswer(postId, comment.id);
    if (error) return toast.error(error.message);
    toast.success(isBest ? "Best answer cleared" : "Marked as best answer");
    onChange();
  };

  return (
    <li className={depth > 0 ? "pl-4 sm:pl-6 border-l border-border" : ""}>
      <div className="flex items-start gap-3">
        <Avatar className="size-8">
          {author?.avatar_url && <AvatarImage src={author.avatar_url} alt="" />}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className={`rounded-2xl px-3 py-2 ${isBest ? "bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-300/60 dark:ring-emerald-700/50" : "bg-muted/60"}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="text-sm font-medium truncate">{name}</div>
                {isBest && <BestAnswerBadge />}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-6 -mr-1"><MoreHorizontal className="size-3.5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!isAuthor && (
                    <DropdownMenuItem onClick={() => setReportOpen(true)}>
                      <Flag className="size-4 mr-2" />Report
                    </DropdownMenuItem>
                  )}
                  {isMod && (
                    <DropdownMenuItem onClick={() => setStatus(comment.status === "hidden" ? "active" : "hidden")}>
                      {comment.status === "hidden" ? <><Eye className="size-4 mr-2" />Restore</> : <><EyeOff className="size-4 mr-2" />Hide</>}
                    </DropdownMenuItem>
                  )}
                  {(isAuthor || isAdmin) && (
                    <DropdownMenuItem onClick={remove} className="text-destructive focus:text-destructive">
                      <Trash2 className="size-4 mr-2" />Delete
                    </DropdownMenuItem>
                  )}
                  {canMarkBest && (
                    <DropdownMenuItem onClick={toggleBest}>
                      <CheckCircle2 className="size-4 mr-2" />
                      {isBest ? "Unmark best answer" : "Mark as best answer"}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed mt-0.5">{comment.body}</p>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{timeAgo(comment.created_at)}</span>
            <ReactionBar targetType="comment" targetId={comment.id} reactions={cReactions} onChange={onChange} compact />
            {depth < 3 && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setReplying((v) => !v)}>
                <MessageSquareReply className="size-3.5 mr-1" />Reply
              </Button>
            )}
          </div>
          {replying && (
            <div className="mt-2">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onPosted={() => { setReplying(false); onChange(); }}
                onCancel={() => setReplying(false)}
                autoFocus
                compact
              />
            </div>
          )}
          {children.length > 0 && (
            <ul className="mt-3 space-y-3">
              {children.map((child) => (
                <CommentItem
                  key={child.id}
                  comment={child}
                  authors={authors}
                  reactions={reactions}
                  childrenByParent={childrenByParent}
                  postId={postId}
                  onChange={onChange}
                  depth={depth + 1}
                  postAuthorId={postAuthorId}
                  postType={postType}
                  bestAnswerCommentId={bestAnswerCommentId}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
      <ReportModal open={reportOpen} onOpenChange={setReportOpen} targetType="comment" targetId={comment.id} />
    </li>
  );
}
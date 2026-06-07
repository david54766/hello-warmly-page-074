import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, MoreHorizontal, Pin, Star, Flag, EyeOff, Eye, Trash2, AlertOctagon } from "lucide-react";
import { PostTypePill } from "./PostTypePill";
import { ReactionBar } from "./ReactionBar";
import { ReportModal } from "./ReportModal";
import { timeAgo, type Post, type Reaction } from "@/lib/feed";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface PostCardSpace { id: string; name: string }
export interface PostCardAuthor { id: string; full_name: string | null; email: string | null; avatar_url: string | null }

export function PostCard({
  post,
  space,
  author,
  reactions,
  commentCount,
  onChange,
  linkToDetail = true,
}: {
  post: Post;
  space?: PostCardSpace | null;
  author?: PostCardAuthor | null;
  reactions: Reaction[];
  commentCount: number;
  onChange: () => void;
  linkToDetail?: boolean;
}) {
  const { user, isAdmin, roles } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const isMod = isAdmin || roles.includes("moderator");
  const isAuthor = user?.id === post.author_id;

  const togglePin = async () => {
    const { error } = await supabase.from("posts").update({ is_pinned: !post.is_pinned }).eq("id", post.id);
    if (error) return toast.error(error.message);
    toast.success(post.is_pinned ? "Unpinned" : "Pinned");
    onChange();
  };
  const toggleFeature = async () => {
    const { error } = await supabase.from("posts").update({ is_featured: !post.is_featured }).eq("id", post.id);
    if (error) return toast.error(error.message);
    toast.success(post.is_featured ? "Unfeatured" : "Featured");
    onChange();
  };
  const setStatus = async (status: "active" | "hidden") => {
    const { error } = await supabase.from("posts").update({ status }).eq("id", post.id);
    if (error) return toast.error(error.message);
    toast.success(status === "hidden" ? "Post hidden" : "Post restored");
    onChange();
  };
  const remove = async () => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) return toast.error(error.message);
    toast.success("Post deleted");
    onChange();
  };

  const name = author?.full_name || author?.email || "Member";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <Card className="rounded-2xl overflow-hidden">
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="size-10">
            {author?.avatar_url && <AvatarImage src={author.avatar_url} alt="" />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
              <span className="font-medium truncate">{name}</span>
              {space && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <Link to="/spaces/$spaceId" params={{ spaceId: space.id }} className="text-muted-foreground hover:text-foreground truncate">
                    {space.name}
                  </Link>
                </>
              )}
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground text-xs">{timeAgo(post.created_at)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <PostTypePill type={post.post_type} />
              {post.is_pinned && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  <Pin className="size-3" />Pinned
                </span>
              )}
              {post.is_featured && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 bg-primary/10 text-primary">
                  <Star className="size-3" />Featured
                </span>
              )}
              {post.status === "hidden" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 bg-muted text-muted-foreground">
                  <EyeOff className="size-3" />Hidden
                </span>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isAuthor && (
                <DropdownMenuItem onClick={() => setReportOpen(true)}>
                  <Flag className="size-4 mr-2" />Report
                </DropdownMenuItem>
              )}
              {isMod && (
                <>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem onClick={togglePin}>
                        <Pin className="size-4 mr-2" />{post.is_pinned ? "Unpin" : "Pin post"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={toggleFeature}>
                        <Star className="size-4 mr-2" />{post.is_featured ? "Unfeature" : "Feature"}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={() => setStatus(post.status === "hidden" ? "active" : "hidden")}>
                    {post.status === "hidden" ? <><Eye className="size-4 mr-2" />Restore</> : <><EyeOff className="size-4 mr-2" />Hide</>}
                  </DropdownMenuItem>
                </>
              )}
              {(isAuthor || isAdmin) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={remove} className="text-destructive focus:text-destructive">
                    <Trash2 className="size-4 mr-2" />Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {post.title && (
          linkToDetail ? (
            <Link to="/posts/$postId" params={{ postId: post.id }} className="block">
              <h3 className="text-lg font-semibold tracking-tight hover:underline">{post.title}</h3>
            </Link>
          ) : (
            <h3 className="text-lg font-semibold tracking-tight">{post.title}</h3>
          )
        )}
        {post.body && (
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed line-clamp-6">{post.body}</p>
        )}

        {post.media_urls.length > 0 && (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            <AlertOctagon className="size-3.5 inline mr-1.5" />
            Media preview coming soon
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <ReactionBar targetType="post" targetId={post.id} reactions={reactions} onChange={onChange} />
          <Button variant="ghost" size="sm" asChild className="h-7">
            <Link to="/posts/$postId" params={{ postId: post.id }}>
              <MessageSquare className="size-4 mr-1.5" />
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </Link>
          </Button>
        </div>
      </CardContent>
      <ReportModal open={reportOpen} onOpenChange={setReportOpen} targetType="post" targetId={post.id} />
    </Card>
  );
}
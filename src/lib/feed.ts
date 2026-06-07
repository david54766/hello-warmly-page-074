export type PostType = "quick_post" | "article" | "question_placeholder" | "event_announcement_placeholder";
export type PostVisibility = "public" | "space_members" | "admins_only" | "hidden";
export type PostStatus = "active" | "hidden" | "deleted";
export type CommentStatus = "active" | "hidden" | "deleted";
export type ReactionType = "like" | "love" | "celebrate" | "helpful";
export type ReportTarget = "post" | "comment";
export type ReportStatus = "pending" | "resolved" | "dismissed";

export interface Post {
  id: string;
  space_id: string;
  author_id: string | null;
  post_type: PostType;
  title: string | null;
  body: string;
  media_urls: string[];
  attachment_urls: string[];
  is_pinned: boolean;
  is_featured: boolean;
  visibility: PostVisibility;
  status: PostStatus;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string | null;
  body: string;
  parent_comment_id: string | null;
  status: CommentStatus;
  created_at: string;
  updated_at: string;
}

export interface Reaction {
  id: string;
  user_id: string;
  target_type: "post" | "comment";
  target_id: string;
  reaction_type: ReactionType;
}

export interface Report {
  id: string;
  reporter_id: string | null;
  target_type: ReportTarget;
  target_id: string;
  reason: string;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export const POST_TYPE_LABELS: Record<PostType, string> = {
  quick_post: "Quick post",
  article: "Article",
  question_placeholder: "Question",
  event_announcement_placeholder: "Event",
};

export const VISIBILITY_LABELS: Record<PostVisibility, string> = {
  public: "Public",
  space_members: "Space members",
  admins_only: "Admins only",
  hidden: "Hidden",
};

export const REACTION_META: Record<ReactionType, { emoji: string; label: string }> = {
  like: { emoji: "👍", label: "Like" },
  love: { emoji: "❤️", label: "Love" },
  celebrate: { emoji: "🎉", label: "Celebrate" },
  helpful: { emoji: "💡", label: "Helpful" },
};

export function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}
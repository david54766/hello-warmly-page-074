import type { LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";

export type SpacePrivacy = "public" | "members_only" | "private" | "hidden";
export type SpaceAccess = "free" | "preview" | "paid_placeholder";
export type SpaceMemberRole = "space_host" | "space_moderator" | "member";

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Space {
  id: string;
  collection_id: string | null;
  name: string;
  tagline: string | null;
  description: string | null;
  cover_image_url: string | null;
  icon: string | null;
  privacy_level: SpacePrivacy;
  access_level: SpaceAccess;
  sort_order: number;
  created_by: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpaceMember {
  id: string;
  space_id: string;
  user_id: string;
  role: SpaceMemberRole;
  status: "active" | "pending" | "banned";
  joined_at: string;
}

export function getIcon(name: string | null | undefined, fallback: LucideIcon = Icons.Hash): LucideIcon {
  if (!name) return fallback;
  const Comp = (Icons as unknown as Record<string, LucideIcon>)[name];
  return Comp ?? fallback;
}

export const PRIVACY_LABELS: Record<SpacePrivacy, string> = {
  public: "Public",
  members_only: "Members only",
  private: "Private",
  hidden: "Hidden",
};

export const ACCESS_LABELS: Record<SpaceAccess, string> = {
  free: "Free",
  preview: "Preview",
  paid_placeholder: "Paid",
};

export function isLocked(space: Pick<Space, "access_level" | "privacy_level">) {
  return space.access_level === "paid_placeholder" || space.privacy_level === "private";
}

export function canJoin(space: Pick<Space, "access_level" | "privacy_level" | "is_archived">) {
  return (
    !space.is_archived &&
    space.access_level === "free" &&
    (space.privacy_level === "public" || space.privacy_level === "members_only")
  );
}
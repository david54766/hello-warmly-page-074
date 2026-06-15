import { supabase } from "@/integrations/supabase/client";

export type ResourceType = "file"|"link"|"pdf"|"video"|"image"|"document"|"template"|"checklist"|"guide"|"other";
export type ResourceVisibility = "public"|"members_only"|"space_members"|"hidden";
export type ResourceAccessLevel = "free"|"preview"|"paid";

export interface ResourceFolder {
  id: string;
  space_id: string | null;
  parent_folder_id: string | null;
  name: string;
  description: string | null;
  sort_order: number;
  visibility: ResourceVisibility;
  access_level: ResourceAccessLevel;
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  space_id: string | null;
  folder_id: string | null;
  title: string;
  description: string | null;
  resource_type: ResourceType;
  file_url: string | null;
  external_url: string | null;
  thumbnail_url: string | null;
  visibility: ResourceVisibility;
  access_level: ResourceAccessLevel;
  is_featured: boolean;
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const db: any = supabase;

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  file: "File", link: "Link", pdf: "PDF", video: "Video", image: "Image",
  document: "Document", template: "Template", checklist: "Checklist",
  guide: "Guide", other: "Other",
};

export const RESOURCE_ACCESS_LABELS: Record<ResourceAccessLevel, string> = {
  free: "Free", preview: "Preview", paid: "Premium",
};

export const RESOURCE_VISIBILITY_LABELS: Record<ResourceVisibility, string> = {
  public: "Public", members_only: "Members only", space_members: "Space members", hidden: "Hidden",
};

export async function fetchResources(opts: { spaceId?: string | null; folderId?: string | null; includeArchived?: boolean } = {}): Promise<Resource[]> {
  let q = db.from("resources").select("*").order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  if (opts.spaceId !== undefined) q = opts.spaceId === null ? q.is("space_id", null) : q.eq("space_id", opts.spaceId);
  if (opts.folderId !== undefined) q = opts.folderId === null ? q.is("folder_id", null) : q.eq("folder_id", opts.folderId);
  if (!opts.includeArchived) q = q.eq("is_archived", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Resource[];
}

export async function fetchAllResourcesAdmin(): Promise<Resource[]> {
  const { data, error } = await db.from("resources").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Resource[];
}

export async function fetchResource(id: string): Promise<Resource | null> {
  const { data } = await db.from("resources").select("*").eq("id", id).maybeSingle();
  return data as Resource | null;
}

export async function fetchFolders(opts: { spaceId?: string | null } = {}): Promise<ResourceFolder[]> {
  let q = db.from("resource_folders").select("*").eq("is_archived", false).order("sort_order");
  if (opts.spaceId !== undefined) q = opts.spaceId === null ? q.is("space_id", null) : q.eq("space_id", opts.spaceId);
  const { data } = await q;
  return (data ?? []) as ResourceFolder[];
}

export async function fetchAllFoldersAdmin(): Promise<ResourceFolder[]> {
  const { data } = await db.from("resource_folders").select("*").order("sort_order");
  return (data ?? []) as ResourceFolder[];
}

export async function createResource(payload: Partial<Resource>): Promise<Resource> {
  const { data, error } = await db.from("resources").insert(payload).select("*").single();
  if (error) throw error;
  return data as Resource;
}

export async function updateResource(id: string, payload: Partial<Resource>): Promise<void> {
  const { error } = await db.from("resources").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteResource(id: string): Promise<void> {
  const { error } = await db.from("resources").delete().eq("id", id);
  if (error) throw error;
}

export async function createFolder(payload: Partial<ResourceFolder>): Promise<ResourceFolder> {
  const { data, error } = await db.from("resource_folders").insert(payload).select("*").single();
  if (error) throw error;
  return data as ResourceFolder;
}

export async function updateFolder(id: string, payload: Partial<ResourceFolder>): Promise<void> {
  const { error } = await db.from("resource_folders").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteFolder(id: string): Promise<void> {
  const { error } = await db.from("resource_folders").delete().eq("id", id);
  if (error) throw error;
}

export async function logResourceView(resourceId: string, userId: string) {
  await db.from("resource_views").insert({ resource_id: resourceId, user_id: userId });
}

export async function logResourceDownload(resourceId: string, userId: string) {
  await db.from("resource_downloads").insert({ resource_id: resourceId, user_id: userId });
}

export async function getResourceStats(resourceId: string): Promise<{ views: number; downloads: number }> {
  const [{ count: v }, { count: d }] = await Promise.all([
    db.from("resource_views").select("*", { count: "exact", head: true }).eq("resource_id", resourceId),
    db.from("resource_downloads").select("*", { count: "exact", head: true }).eq("resource_id", resourceId),
  ]);
  return { views: v ?? 0, downloads: d ?? 0 };
}

export async function getAdminResourceTotals(): Promise<{ totalResources: number; totalViews: number; totalDownloads: number }> {
  const [{ count: r }, { count: v }, { count: d }] = await Promise.all([
    db.from("resources").select("*", { count: "exact", head: true }).eq("is_archived", false),
    db.from("resource_views").select("*", { count: "exact", head: true }),
    db.from("resource_downloads").select("*", { count: "exact", head: true }),
  ]);
  return { totalResources: r ?? 0, totalViews: v ?? 0, totalDownloads: d ?? 0 };
}

export function resourceHref(r: Pick<Resource, "external_url"|"file_url">): string | null {
  return r.external_url || r.file_url || null;
}
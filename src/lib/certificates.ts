import { supabase } from "@/integrations/supabase/client";

const db: any = supabase;

export type CertificateStatus = "issued" | "revoked";

export interface Certificate {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  template_url: string | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCertificate {
  id: string;
  user_id: string;
  certificate_id: string;
  course_id: string;
  issued_at: string;
  certificate_url: string | null;
  status: CertificateStatus;
  created_at: string;
  updated_at: string;
}

export async function fetchCertificates(): Promise<Certificate[]> {
  const { data } = await db.from("certificates").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function fetchCertificateForCourse(courseId: string): Promise<Certificate | null> {
  const { data } = await db.from("certificates").select("*").eq("course_id", courseId).eq("active", true).maybeSingle();
  return data ?? null;
}

export async function createCertificate(input: Partial<Certificate>, createdBy: string) {
  const { data, error } = await db.from("certificates").insert({ ...input, created_by: createdBy }).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateCertificate(id: string, patch: Partial<Certificate>) {
  await db.from("certificates").update(patch).eq("id", id);
}

export async function deleteCertificate(id: string) {
  await db.from("certificates").delete().eq("id", id);
}

export async function fetchMyCertificates(userId: string): Promise<UserCertificate[]> {
  const { data } = await db.from("user_certificates").select("*").eq("user_id", userId).order("issued_at", { ascending: false });
  return data ?? [];
}

export async function fetchUserCertificate(id: string): Promise<UserCertificate | null> {
  const { data } = await db.from("user_certificates").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function fetchAllIssuedCertificates(): Promise<UserCertificate[]> {
  const { data } = await db.from("user_certificates").select("*").order("issued_at", { ascending: false }).limit(500);
  return data ?? [];
}

export async function fetchMyCertificateForCourse(userId: string, courseId: string): Promise<UserCertificate | null> {
  const { data } = await db.from("user_certificates").select("*")
    .eq("user_id", userId).eq("course_id", courseId).maybeSingle();
  return data ?? null;
}
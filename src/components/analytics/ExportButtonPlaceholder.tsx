import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ExportKind = "members" | "posts" | "course_progress" | "rsvps" | "revenue" | "audit_logs";

const SOURCES: Record<ExportKind, { table: string; cols: string }> = {
  members: { table: "profiles", cols: "id,full_name,email,status,created_at,last_active_at" },
  posts: { table: "posts", cols: "id,title,author_id,space_id,status,created_at" },
  course_progress: { table: "lesson_progress", cols: "id,user_id,lesson_id,status,completed_at" },
  rsvps: { table: "event_rsvps", cols: "id,event_id,user_id,created_at" },
  revenue: { table: "purchases", cols: "id,user_id,amount,currency,status,created_at" },
  audit_logs: { table: "audit_logs", cols: "id,actor_id,action_type,target_type,target_id,created_at" },
};

function toCsv(rows: any[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => v == null ? "" : `"${String(v).replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export function ExportButtonPlaceholder({ kind, label }: { kind: ExportKind; label?: string }) {
  const onClick = async () => {
    const src = SOURCES[kind];
    try {
      const { data, error } = await (supabase as any).from(src.table).select(src.cols).limit(5000);
      if (error) throw error;
      const csv = toCsv(data ?? []);
      if (!csv) { toast.info("Nothing to export yet"); return; }
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${kind}-${new Date().toISOString().slice(0,10)}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Export ready");
    } catch (e: any) { toast.error(e.message ?? "Export failed"); }
  };
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <Download className="size-4 mr-1.5" />{label ?? `Export ${kind.replace("_"," ")}`}
    </Button>
  );
}
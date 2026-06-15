import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchAllFoldersAdmin, createFolder, updateFolder, deleteFolder, type ResourceFolder,
} from "@/lib/resources";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminResourceFolderForm } from "@/components/resources/AdminResourceFolderForm";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/resource-folders")({
  component: AdminResourceFoldersPage,
});

function AdminResourceFoldersPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [spaces, setSpaces] = useState<{ id: string; name: string }[]>([]);
  const [editing, setEditing] = useState<Partial<ResourceFolder> | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [isAdmin, loading, navigate]);

  const reload = async () => {
    const [f, { data: sp }] = await Promise.all([
      fetchAllFoldersAdmin(),
      supabase.from("spaces").select("id,name").order("name"),
    ]);
    setFolders(f); setSpaces((sp ?? []) as any);
  };
  useEffect(() => { if (isAdmin) reload(); }, [isAdmin]);

  const onSubmit = async (v: Partial<ResourceFolder>) => {
    try {
      if (editing?.id) await updateFolder(editing.id, v);
      else await createFolder(v);
      toast.success(editing?.id ? "Folder saved" : "Folder created");
      setOpen(false); setEditing(null); reload();
    } catch (e: any) { toast.error(e?.message ?? "Save failed"); }
  };

  const onDelete = async (f: ResourceFolder) => {
    if (!confirm(`Delete folder "${f.name}"? This will fail if it has resources.`)) return;
    try { await deleteFolder(f.id); toast.success("Deleted"); reload(); }
    catch (e: any) { toast.error(e?.message ?? "Delete failed (folder may not be empty)"); }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild><Link to="/admin/resources"><ArrowLeft className="size-4 mr-1.5" />Resources</Link></Button>
          <h1 className="text-2xl font-semibold tracking-tight mt-2">Resource folders</h1>
        </div>
        <Button onClick={() => { setEditing({}); setOpen(true); }}><Plus className="size-4 mr-1.5" />New folder</Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="pt-5">
          {folders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No folders yet.</p>
          ) : (
            <ul className="divide-y">
              {folders.map((f) => (
                <li key={f.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{f.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {f.space_id ? `Space: ${spaces.find((s) => s.id === f.space_id)?.name ?? f.space_id}` : "Global"} · {f.visibility} · {f.access_level}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(f); setOpen(true); }}><Pencil className="size-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(f)}><Trash2 className="size-4 text-destructive" /></Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit folder" : "New folder"}</DialogTitle></DialogHeader>
          {editing !== null && (
            <AdminResourceFolderForm
              initial={editing}
              spaces={spaces}
              folders={folders}
              onSubmit={onSubmit}
              onCancel={() => { setOpen(false); setEditing(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
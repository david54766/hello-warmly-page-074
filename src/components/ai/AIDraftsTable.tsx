import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Archive } from "lucide-react";
import { CONTENT_TYPE_LABELS, type AIGeneratedContent } from "@/lib/ai";

export function AIDraftsTable({ rows, onArchive }: { rows: AIGeneratedContent[]; onArchive: (id: string) => void }) {
  if (rows.length === 0) return <Card className="rounded-2xl p-8 text-center text-sm text-muted-foreground">No AI drafts yet. Generate content from the AI Assistant and save it as a draft.</Card>;
  return (
    <div className="rounded-2xl border overflow-hidden bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr><th className="text-left p-3">Title</th><th className="text-left p-3">Type</th><th className="text-left p-3">Status</th><th className="text-left p-3">Created</th><th className="text-right p-3">Actions</th></tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id} className="border-t">
              <td className="p-3 font-medium">{d.title}</td>
              <td className="p-3 text-muted-foreground">{CONTENT_TYPE_LABELS[d.content_type] ?? d.content_type}</td>
              <td className="p-3 capitalize">{d.status}</td>
              <td className="p-3 text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</td>
              <td className="p-3 text-right space-x-1">
                <Button asChild variant="ghost" size="sm"><Link to="/admin/ai-drafts/$draftId" params={{ draftId: d.id }}><Edit className="size-4 mr-1" />Open</Link></Button>
                {d.status !== "archived" && <Button variant="ghost" size="sm" onClick={() => onArchive(d.id)}><Archive className="size-4 mr-1" />Archive</Button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
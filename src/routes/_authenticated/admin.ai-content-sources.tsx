import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  listContentSources, toggleSourceApproval, SOURCE_TYPE_LABELS,
  type AIContentSource, type AIContentSourceType,
} from "@/lib/memberAi";
import { AIContentSourcesTable } from "@/components/ai/AIContentSourcesTable";
import { AIContentSourcePreview } from "@/components/ai/AIContentSourcePreview";

export const Route = createFileRoute("/_authenticated/admin/ai-content-sources")({ component: Page });

function Page() {
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [sources, setSources] = useState<AIContentSource[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<AIContentSourceType | "all">("all");
  const [preview, setPreview] = useState<AIContentSource | null>(null);

  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/dashboard" }); }, [isAdmin, loading, nav]);

  const load = () => listContentSources({ type, search }).then(setSources);
  useEffect(() => { if (isAdmin) load(); }, [isAdmin, type, search]);

  if (!isAdmin) return null;

  const onToggle = async (id: string, v: boolean) => {
    try { await toggleSourceApproval(id, v); toast.success(v ? "Approved" : "Unapproved"); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <h1 className="text-2xl font-semibold">AI Content Sources</h1>
      </div>
      <p className="text-sm text-muted-foreground">Approve which content the member AI helper is allowed to use. Locked/premium and unapproved content stays hidden from member answers.</p>

      <Card>
        <CardHeader><CardTitle className="text-base">Filters</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <div className="text-xs mb-1 text-muted-foreground">Search</div>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title…" />
          </div>
          <div>
            <div className="text-xs mb-1 text-muted-foreground">Type</div>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {Object.entries(SOURCE_TYPE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.info("Refresh sources (placeholder)")}>
            <RefreshCw className="size-3 mr-1" />Refresh
          </Button>
        </CardContent>
      </Card>

      <AIContentSourcesTable sources={sources} onToggle={onToggle} onPreview={setPreview} />
      <AIContentSourcePreview source={preview} open={!!preview} onOpenChange={(o) => !o && setPreview(null)} />
    </div>
  );
}

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { searchMembers, testAutomation, type Automation, type MemberOption, type TestAutomationResult } from "@/lib/automations";
import { AutomationExecutionSummary } from "./AutomationExecutionSummary";

export function TestAutomationModal({ automation, onLogged }: { automation: Automation; onLogged?: () => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [selected, setSelected] = useState<MemberOption | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TestAutomationResult | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      try { setMembers(await searchMembers(query, 8)); } catch { /* noop */ }
    }, 200);
    return () => clearTimeout(t);
  }, [query, open]);

  const reset = () => { setSelected(null); setResult(null); setQuery(""); };

  const run = async () => {
    if (!selected) { toast.error("Pick a member"); return; }
    setRunning(true);
    try {
      const r = await testAutomation(automation.id, selected.id);
      setResult(r);
      if ((r as any).error) toast.error(String((r as any).error));
      else toast.success(`Test ${r.status}`);
      onLogged?.();
    } catch (e: any) { toast.error(e?.message ?? "Test failed"); }
    finally { setRunning(false); }
  };

  return (
    <>
      <Button variant="outline" onClick={() => { reset(); setOpen(true); }}>
        <PlayCircle className="size-4 mr-1.5" />Test with member
      </Button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Test "{automation.name}"</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1.5">Pick test member</p>
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email" />
              <div className="mt-2 max-h-44 overflow-auto rounded-md border divide-y">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelected(m)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${selected?.id === m.id ? "bg-muted" : ""}`}
                  >
                    <div className="font-medium">{m.full_name || m.email || m.id.slice(0, 8)}</div>
                    {m.email && <div className="text-xs text-muted-foreground">{m.email}</div>}
                  </button>
                ))}
                {members.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No members.</p>}
              </div>
              {selected && (
                <p className="text-xs text-muted-foreground mt-2">
                  Selected: <span className="font-medium text-foreground">{selected.full_name || selected.email}</span>
                </p>
              )}
            </div>
            {result && (
              <div className="rounded-xl border p-3">
                <AutomationExecutionSummary result={result} />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Test runs against the selected member and actually executes actions (notifications, tags, badges, etc.). Dedupe is bypassed.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            <Button onClick={run} disabled={running || !selected}>{running ? "Running…" : "Run test"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
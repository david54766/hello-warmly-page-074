import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { insertTestLog, type Automation } from "@/lib/automations";

export function TestAutomationButton({ automation, onLogged }: { automation: Automation; onLogged?: () => void }) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);

  const runTest = async () => {
    setRunning(true);
    try {
      await insertTestLog(automation, "success");
      toast.success("Test placeholder logged");
      onLogged?.();
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not log test");
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}><PlayCircle className="size-4 mr-1.5" />Test automation</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Test automation</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Real test execution will be connected in the next phase. For now, running a test creates a placeholder log entry so you can preview how runs will appear.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={runTest} disabled={running}>{running ? "Running…" : "Log test run"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
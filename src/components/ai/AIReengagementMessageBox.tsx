import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const TEMPLATES = [
  { key: "checkin", label: "Friendly check-in", text: "Hey! Just wanted to check in — haven't seen you around lately. Anything we can help with?" },
  { key: "course", label: "Course reminder", text: "Hi! There's a great course you started but haven't finished yet. Want me to send you the link?" },
  { key: "event", label: "Event invitation", text: "Hi! We've got an upcoming event you might love. RSVP is open — would be great to see you there." },
  { key: "intro", label: "Intro prompt", text: "Welcome again! When you have a minute, drop a quick intro in the Welcome space — the community would love to meet you." },
  { key: "support", label: "Supportive note", text: "Hey, just a quick note — we're glad you're part of the community. If you're stuck on anything, reply and let us know." },
];

export function AIReengagementMessageBox() {
  const [text, setText] = useState(TEMPLATES[0].text);
  const copy = async () => { await navigator.clipboard.writeText(text); toast.success("Copied"); };
  const placeholder = (label: string) => toast.info(`${label} (placeholder)`);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><MessageCircle className="size-4 text-primary" /> AI Re-engagement Drafts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <Button key={t.key} size="sm" variant="outline" onClick={() => setText(t.text)}>{t.label}</Button>
          ))}
        </div>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} />
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={copy}><Copy className="size-3 mr-1" />Copy</Button>
          <Button size="sm" variant="outline" onClick={() => placeholder("Saved as draft")}>Save draft</Button>
          <Button size="sm" variant="outline" onClick={() => placeholder("Sent as notification")}>Send as notification</Button>
          <Button size="sm" variant="outline" onClick={() => placeholder("Sent as private message")}>Send as DM</Button>
        </div>
      </CardContent>
    </Card>
  );
}

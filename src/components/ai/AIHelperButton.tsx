import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getHelperSettings } from "@/lib/memberAi";

export function AIHelperButton() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => { getHelperSettings().then((s) => setEnabled(!!s?.member_ai_enabled)); }, []);
  if (!enabled) return null;
  return (
    <Link
      to="/ai-helper"
      className="fixed bottom-20 md:bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg px-4 py-3 text-sm font-medium hover:opacity-90"
    >
      <Sparkles className="size-4" /> Ask AI Helper
    </Link>
  );
}

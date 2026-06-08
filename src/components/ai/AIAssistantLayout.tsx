import type { ReactNode } from "react";

export function AIAssistantLayout({ sidebar, main, preview }: { sidebar: ReactNode; main: ReactNode; preview?: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[16rem_1fr_20rem]">
      <div>{sidebar}</div>
      <div className="border rounded-2xl bg-card flex flex-col min-h-[70vh]">{main}</div>
      <div className="space-y-4">{preview}</div>
    </div>
  );
}
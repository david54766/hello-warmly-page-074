import { ReactNode } from "react";
import { Sparkles } from "lucide-react";

export function MemberAIHelperLayout({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row">
      <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r bg-card overflow-y-auto">
        <div className="p-4 border-b flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="font-semibold">Community Helper</span>
        </div>
        {sidebar}
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}

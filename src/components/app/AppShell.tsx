import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileBottomNav } from "./MobileBottomNav";
import { AnnouncementBanner } from "@/components/announcements/AnnouncementBanner";
import { AIHelperButton } from "@/components/ai/AIHelperButton";
import { useAuth } from "@/hooks/useAuth";
import { AlertOctagon } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const suspended = profile?.status === "suspended";
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          <TopBar />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8 max-w-7xl w-full mx-auto">
            {suspended && (
              <div className="mb-4 rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
                <div className="flex items-start gap-3">
                  <AlertOctagon className="size-5 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <h2 className="font-semibold text-destructive">Your account access is restricted.</h2>
                    <p className="text-sm text-muted-foreground mt-1">Please contact support if you believe this is a mistake.</p>
                  </div>
                </div>
              </div>
            )}
            <div className="mb-4"><AnnouncementBanner /></div>
            {children}
          </main>
        </div>
      </div>
      <MobileBottomNav />
      <AIHelperButton />
    </div>
  );
}
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileBottomNav } from "./MobileBottomNav";
import { AnnouncementBanner } from "@/components/announcements/AnnouncementBanner";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          <TopBar />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
            <div className="mb-4"><AnnouncementBanner /></div>
            {children}
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
import React from "react";
import type { Metadata } from "next";
import { DemoBar } from "@/components/shell/DemoBar";
import { StudentHeader } from "@/components/student/StudentHeader";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { BottomNav } from "@/components/student/BottomNav";
import { ConnectivityBanner } from "@/components/student/ConnectivityBanner";

export const metadata: Metadata = {
  title: "Portal Siswa PKL — VokaLink",
  description:
    "Logbook harian offline-first, pencatatan kartu kerja zero-typing, bukti WebP, dan portofolio CV ATS VokaLink.",
};

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 selection:bg-sky-500 selection:text-white flex flex-col font-sans">
      {/* 1. DEMO BAR (Top Judge Switcher) */}
      <DemoBar />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* 2. Mobile-only top header (hidden on desktop md:hidden) */}
        <StudentHeader />

        {/* 3. Desktop Left Slim Sidebar Dock (hidden on mobile, sticky on desktop) */}
        <div className="hidden md:flex pl-3.5 lg:pl-4 py-4 shrink-0">
          <StudentSidebar />
        </div>

        {/* 4. Main Content Container */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Connectivity Status Banner (Offline / Syncing / Synced) */}
          <ConnectivityBanner />

          <main className="flex-1 w-full max-w-[1520px] mx-auto px-2 sm:px-3 lg:px-4 py-4 pb-24 md:pb-8">
            {children}
          </main>
        </div>

        {/* 5. Bottom Navigation (Only visible on mobile screens < 768px via md:hidden) */}
        <BottomNav />
      </div>
    </div>
  );
}

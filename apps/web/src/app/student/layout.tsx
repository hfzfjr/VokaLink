import React from "react";
import type { Metadata } from "next";
import { StudentHeader } from "@/components/student/StudentHeader";
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
    <div className="min-h-screen bg-slate-50/70 flex flex-col text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Responsive Header: Mobile Brand + Desktop Nav */}
      <StudentHeader />

      {/* Connectivity Status Banner (Offline / Syncing / Synced) */}
      <ConnectivityBanner />

      {/* Main Content Area (Mobile: max-w-md with pb-24; Desktop: max-w-6xl with pb-12) */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24 md:pb-12">
        {children}
      </main>

      {/* Bottom Navigation (Only visible on mobile screens < 768px via md:hidden) */}
      <BottomNav />
    </div>
  );
}

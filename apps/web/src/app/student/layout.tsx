import React from "react";
import type { Metadata } from "next";
import { StudentHeader } from "@/components/student/StudentHeader";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { BottomNav } from "@/components/student/BottomNav";
import { PwaInstallPrompt } from "@/components/student/PwaInstallPrompt";
import { AuthGuard } from "@/components/auth/AuthGuard";

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
    <AuthGuard allowedRoles={["STUDENT"]}>
      <div className="min-h-screen bg-slate-50/80 text-slate-900 selection:bg-sky-500 selection:text-white flex flex-col font-sans print:bg-white print:p-0 print:m-0 print:min-h-0 print:block">
        {/* 1. Aksesibilitas: Skip-to-Content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-xl focus:text-xs focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
        >
          Lewati ke konten utama
        </a>
      <div className="flex-1 flex flex-col md:flex-row print:block print:w-full print:p-0 print:m-0">
        {/* 2. Mobile-only top header (hidden on desktop md:hidden, hidden on print) */}
        <div className="md:hidden no-print print:hidden">
          <StudentHeader />
        </div>

        {/* 3. Desktop Left Slim Sidebar Dock (hidden on mobile, sticky on desktop, hidden on print) */}
        <div className="hidden md:flex md:sticky md:top-0 md:h-dvh pl-3.5 lg:pl-4 py-4 shrink-0 w-[88px] lg:w-[92px] z-30 no-print print:hidden">
          <StudentSidebar />
        </div>

        {/* 4. Main Content Container */}
        <div className="flex-1 min-w-0 flex flex-col print:block print:w-full print:p-0 print:m-0">
          <main
            id="main-content"
            className="flex-1 w-full max-w-[1680px] mx-auto px-3 sm:px-4 lg:px-6 py-4 md:py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-10 print:p-0 print:m-0 print:max-w-none print:w-full"
          >
            {children}
          </main>
        </div>
      </div>

      {/* 5. PWA Install Floating Banner (mobile & desktop prompt) */}
      <div className="no-print print:hidden">
        <PwaInstallPrompt />
      </div>

      {/* 6. Bottom Navigation (Only visible on mobile screens < 768px via md:hidden, hidden on print) */}
      <div className="md:hidden no-print print:hidden">
        <BottomNav />
      </div>
    </div>
    </AuthGuard>
  );
}

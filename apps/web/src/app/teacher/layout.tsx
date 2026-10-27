import React, { Suspense } from "react";
import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { TeacherHeader } from "@/components/teacher/TeacherHeader";
import { TeacherSidebar } from "@/components/teacher/TeacherSidebar";
import { TeacherBottomNav } from "@/components/teacher/TeacherBottomNav";

export const metadata: Metadata = {
  title: "Portal Guru Pembimbing — VokaLink",
  description:
    "Live Competency Heatmap, deteksi drift kesenjangan kurikulum, dan intervensi pembimbingan PKL siswa.",
};

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["TEACHER"]}>
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
            <TeacherHeader />
          </div>

          {/* 3. Desktop Left Slim Sidebar Dock (hidden on mobile, sticky on desktop, hidden on print) */}
          <div className="hidden md:flex md:sticky md:top-0 md:h-dvh pl-3.5 lg:pl-4 py-4 shrink-0 w-[88px] lg:w-[92px] z-30 no-print print:hidden">
            <TeacherSidebar />
          </div>

          {/* 4. Main Content Container */}
          <div className="flex-1 min-w-0 flex flex-col print:block print:w-full print:p-0 print:m-0">
            <main
              id="main-content"
              className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-5 lg:px-8 py-4 md:py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-10 print:p-0 print:m-0 print:max-w-none print:w-full"
            >
              {children}
            </main>
          </div>
        </div>

        {/* 5. Bottom Navigation (Only visible on mobile screens < 768px via md:hidden, hidden on print) */}
        <div className="md:hidden no-print print:hidden">
          <Suspense fallback={null}>
            <TeacherBottomNav />
          </Suspense>
        </div>
      </div>
    </AuthGuard>
  );
}

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BottomNav } from "@/components/student/BottomNav";
import { ConnectivityBanner } from "@/components/student/ConnectivityBanner";
import { Sparkles, ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Mobile Wrapper (Centered max-w-md for mobile-first app feel) */}
      <div className="w-full max-w-md min-h-screen bg-slate-50 shadow-xl flex flex-col relative border-x border-slate-200/70">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              title="Kembali ke Beranda Utama"
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
              aria-label="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-slate-900 leading-none">
                  VokaLink
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold leading-none">
                  SISWA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-1">
                Fase F · Target 792 JP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-700">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>RPL</span>
            </div>
          </div>
        </header>

        {/* Connectivity Status Banner (Offline / Syncing / Synced) */}
        <ConnectivityBanner />

        {/* Main Content Area (pb-24 prevents bottom nav overlap) */}
        <main className="flex-1 w-full px-4 pt-3 pb-24 overflow-y-auto">
          {children}
        </main>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  PlusCircle,
  FileCheck2,
  BookOpen,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { TOTAL_TARGET_JP } from "@vokalink/shared";
import { DemoBar } from "./DemoBar";
import { StudentHeader } from "@/components/student/StudentHeader";
import { BottomNav } from "@/components/student/BottomNav";
import { ConnectivityBanner } from "@/components/student/ConnectivityBanner";

interface StudentShellProps {
  children: React.ReactNode;
  /** Sembunyikan panel samping di desktop jika halaman membutuhkan lebar penuh (misal CV A4) */
  hideSidePanel?: boolean;
}

export function StudentShell({ children, hideSidePanel }: StudentShellProps) {
  const pathname = usePathname();
  const isCvPage = pathname === "/student/career-cv";
  const shouldShowSidePanel = !hideSidePanel && !isCvPage;

  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* 1. DEMO BAR (Top Judge Switcher) */}
      <DemoBar />

      {/* 2. RESPONSIVE STUDENT HEADER */}
      <StudentHeader />

      {/* 3. CONNECTIVITY STATUS (BANNER) */}
      <ConnectivityBanner />

      {/* 4. MAIN LAYOUT: 1 Col on Mobile (<lg), 2 Col on Desktop (≥lg) */}
      <div className="flex-1 w-full max-w-[1680px] mx-auto px-3 sm:px-4 lg:px-6 pt-4 pb-24 lg:pb-12">
        <div className="flex gap-8 items-start">
          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {children}
          </main>

          {/* Desktop Sticky Summary Panel (320px) — Sesuai CP2 */}
          {shouldShowSidePanel && (
            <aside className="hidden lg:block w-[320px] shrink-0 sticky top-20 space-y-4 print:hidden">
              {/* Card Ringkasan Siswa & PKL */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800">Status PKL Aktif</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                    Fase F
                  </span>
                </div>

                <div className="mt-3.5 space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Mitra DUDI
                    </p>
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="size-4 text-sky-500 shrink-0" />
                      <span>PT Industri Rekayasa Nusantara</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Target Jam Pelajaran (JP)
                    </p>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-lg font-black text-slate-900 tracking-tight">
                        512 <span className="text-xs font-medium text-slate-400">/ {TOTAL_TARGET_JP} JP</span>
                      </span>
                      <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                        64.6%
                      </span>
                    </div>
                    {/* Mini Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 mt-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all duration-300"
                        style={{ width: "64.6%" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <Link
                    href="/student/log/new"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition active:scale-[0.98]"
                  >
                    <PlusCircle className="size-4" />
                    <span>Catat Jurnal Hari Ini</span>
                  </Link>
                </div>
              </div>

              {/* Card Tautan Cepat */}
              <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
                <p className="text-xs font-bold text-slate-800 px-2 mb-2">
                  Akses Cepat Dokumen
                </p>
                <div className="space-y-1">
                  <Link
                    href="/student/log/history"
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 text-xs font-medium text-slate-700 transition group"
                  >
                    <span className="flex items-center gap-2.5">
                      <BookOpen className="size-4 text-slate-400 group-hover:text-sky-500 transition" />
                      <span>Riwayat Logbook</span>
                    </span>
                    <ChevronRight className="size-3.5 text-slate-400" />
                  </Link>

                  <Link
                    href="/student/career-cv"
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 text-xs font-medium text-slate-700 transition group"
                  >
                    <span className="flex items-center gap-2.5">
                      <FileCheck2 className="size-4 text-slate-400 group-hover:text-sky-500 transition" />
                      <span>CV ATS & Paspor Portofolio</span>
                    </span>
                    <ChevronRight className="size-3.5 text-slate-400" />
                  </Link>

                  <Link
                    href="/verify/andi-pratama-rpl-2026"
                    target="_blank"
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-sky-50 text-xs font-semibold text-sky-700 transition group"
                  >
                    <span className="flex items-center gap-2.5">
                      <ExternalLink className="size-4 text-sky-500" />
                      <span>Lihat Paspor Publik (QR)</span>
                    </span>
                    <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                      Resmi
                    </span>
                  </Link>
                </div>
              </div>

              {/* Badge Jaminan Keamanan Offline */}
              <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 text-slate-500 text-[11px]">
                <ShieldCheck className="size-5 text-emerald-500 shrink-0" />
                <span>
                  Offline-first aktif via Dexie IndexedDB. Bukti tersimpan aman tanpa kuota.
                </span>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* 5. BOTTOM NAVIGATION BAR (Mobile < lg) */}
      <BottomNav />
    </div>
  );
}

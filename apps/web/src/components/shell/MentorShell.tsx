"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Building } from "lucide-react";
import { DemoBar } from "./DemoBar";

interface MentorShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBackHome?: boolean;
}

export function MentorShell({
  children,
  title = "Verifikasi Cepat Mentor Industri",
  subtitle = "Persetujuan logbook PKL zero-login & tanda tangan digital aman",
  showBackHome = true,
}: MentorShellProps) {
  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* 1. DEMO BAR */}
      <DemoBar />

      {/* 2. COMPACT HEADER */}
      <header className="w-full bg-white border-b border-slate-200/80 px-4 py-3 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black shadow-xs shadow-sky-500/20">
              <Building className="size-4" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 tracking-tight block leading-tight">
                VokaLink <span className="text-sky-500">Mentor</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Verifikasi Industri
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-bold">
              <ShieldCheck className="size-3 text-emerald-600" />
              <span>PIN & Device Token</span>
            </span>
          </div>
        </div>
      </header>

      {/* 3. CENTERED 1-COLUMN CONTAINER (max-w-md) */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-6 flex flex-col justify-center">
        {(title || subtitle) && (
          <div className="mb-6 text-center">
            {title && (
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="w-full">
          {children}
        </div>
      </main>

      {/* 4. COMPACT FOOTER */}
      <footer className="w-full py-4 px-4 text-center text-[11px] text-slate-400 border-t border-slate-200/60 bg-white/50">
        <div className="max-w-md mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 VokaLink &bull; Standar Industri PKL</span>
          {showBackHome && (
            <Link
              href="/"
              className="text-sky-600 hover:text-sky-700 font-semibold hover:underline"
            >
              Halaman Depan
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}

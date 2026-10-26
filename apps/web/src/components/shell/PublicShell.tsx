"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Printer } from "lucide-react";
import VokaIcon from "@/components/common/VokaIcon";
import { DemoBar } from "./DemoBar";

interface PublicShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showPrintButton?: boolean;
}

export function PublicShell({
  children,
  title,
  subtitle,
  showPrintButton = true,
}: PublicShellProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col font-sans selection:bg-sky-500 selection:text-white print:bg-white print:text-black">
      {/* 1. DEMO BAR (Hidden on print) */}
      <div className="print:hidden">
        <DemoBar />
      </div>

      {/* 2. PUBLIC HEADER (Hidden on print for clean document view) */}
      <header className="w-full bg-white border-b border-slate-200/80 px-4 py-3 sticky top-0 z-30 shadow-2xs print:hidden">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-xs p-1 flex items-center justify-center group-hover:scale-105 group-hover:border-sky-300 transition">
              <VokaIcon className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 tracking-tight block leading-tight">
                VokaLink <span className="text-sky-500">Paspor</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Verifikasi Publik
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {showPrintButton && (
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 cursor-pointer shadow-xs"
              >
                <Printer className="size-3.5 text-slate-500" />
                <span className="hidden sm:inline">Cetak Dokumen</span>
              </button>
            )}

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span>Segel Kriptografis</span>
            </span>
          </div>
        </div>
      </header>

      {/* 3. CENTERED 1-COLUMN CONTAINER (max-w-3xl) */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 sm:py-8 print:p-0 print:max-w-none">
        {(title || subtitle) && (
          <div className="mb-6 print:hidden">
            {title && (
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="w-full">
          {children}
        </div>
      </main>

      {/* 4. FOOTER VERIFIKASI RESMI */}
      <footer className="w-full py-5 px-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50 print:hidden mt-auto">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 VokaLink &bull; Standar Paspor Kompetensi Vokasi Ber-QR</span>
          <Link
            href="/"
            className="text-sky-600 hover:text-sky-700 font-semibold text-xs"
          >
            Portal VokaLink &rarr;
          </Link>
        </div>
      </footer>
    </div>
  );
}

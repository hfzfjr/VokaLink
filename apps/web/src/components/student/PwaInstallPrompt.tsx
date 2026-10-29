"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  X,
  Smartphone,
  Share2,
  PlusSquare,
  CheckCircle2,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { cn } from "@/lib/cn";

interface PwaInstallPromptProps {
  className?: string;
  forceShowForDemo?: boolean;
}

export function PwaInstallPrompt({ className, forceShowForDemo = false }: PwaInstallPromptProps) {
  const {
    isInstallable,
    isInstalled,
    isDismissed,
    isIOS,
    showIOSGuide,
    promptInstall,
    dismissPrompt,
    openIOSGuide,
    closeIOSGuide,
  } = usePwaInstall();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // Sembunyikan bila sudah terinstal atau sudah di-dismiss (kecuali mode demo)
  if (!forceShowForDemo) {
    if (isInstalled || isDismissed || !isInstallable) {
      return null;
    }
  }

  return (
    <>
      {/* ─── Floating Mini Banner PWA di Mobile (Melayang di atas BottomNav) ─── */}
      <aside
        aria-label="Pemberitahuan Pasang Aplikasi VokaLink"
        className={cn(
          "fixed z-30 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] left-3 right-3 sm:left-auto sm:right-5 sm:max-w-sm animate-in slide-in-from-bottom-3 duration-200",
          className
        )}
      >
        <div className="relative bg-white/95 backdrop-blur-xl border border-sky-200/90 rounded-3xl p-4 shadow-[0_10px_35px_-8px_rgba(14,165,233,0.22)] ring-1 ring-sky-500/10 space-y-3">
          {/* Tombol Tutup (X) */}
          <button
            type="button"
            onClick={dismissPrompt}
            aria-label="Tutup pemberitahuan pasang aplikasi"
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-400 hover:text-slate-700 absolute top-3 right-3 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Baris Atas: Logo App + Judul & Subjudul */}
          <div className="flex items-start gap-3 pr-6">
            <div className="w-11 h-11 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 border border-sky-400/40">
              VL
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight leading-tight">
                  Pasang Aplikasi VokaLink
                </h4>
                <span className="px-1.5 py-0.2 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 text-[9.5px] font-bold">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal leading-relaxed mt-0.5">
                Akses jurnal harian lebih cepat &amp; hemat kuota di layar utama HP Anda.
              </p>
            </div>
          </div>

          {/* Fitur Utama Micro-Pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[10px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
              <WifiOff className="w-2.5 h-2.5 text-sky-600" />
              <span>100% Offline-First</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
              <span>Bebas Kuota</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
              <Smartphone className="w-2.5 h-2.5 text-emerald-600" />
              <span>Tanpa Play Store</span>
            </span>
          </div>

          {/* Tombol Aksi */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={isIOS ? openIOSGuide : promptInstall}
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-full bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white text-xs font-semibold shadow-xs shadow-sky-500/25 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isIOS ? "Petunjuk di iPhone" : "Pasang Sekarang"}</span>
            </button>

            <button
              type="button"
              onClick={dismissPrompt}
              className="px-3.5 h-10 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-medium transition cursor-pointer"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Modal Petunjuk Pemasangan di iOS Safari ─── */}
      {showIOSGuide &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            onClick={closeIOSGuide}
            className="fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in-0 duration-150"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-modal border border-slate-200/90 space-y-4 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8.5 h-8.5 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    VL
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Pasang di Layar iPhone</h3>
                    <p className="text-[11px] text-slate-500 font-normal">Panduan 3 Langkah Cepat</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeIOSGuide}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 3 Langkah Visual */}
              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    1
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                      <span>Ketuk tombol Bagikan</span>
                      <Share2 className="w-3.5 h-3.5 text-sky-600 inline" />
                    </p>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Terletak di bilah menu bagian bawah pada browser Safari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    2
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                      <span>Pilih Tambah ke Layar Utama</span>
                      <PlusSquare className="w-3.5 h-3.5 text-sky-600 inline" />
                    </p>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Gulir menu ke bawah lalu pilih opsi <strong>&quot;Add to Home Screen&quot;</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    3
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                      <span>Ketuk Tambah di Pojok Kanan</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                    </p>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Aplikasi VokaLink akan langsung tampil di beranda smartphone layaknya aplikasi native.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tombol Selesai */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={closeIOSGuide}
                  className="w-full py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Saya Mengerti
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

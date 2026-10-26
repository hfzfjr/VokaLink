"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import VokaIcon from "@/components/common/VokaIcon";

export function StudentHeader() {
  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/70">
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand & Left section */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            title="Kembali ke Beranda Utama"
            className="w-9 h-9 min-w-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-600 transition cursor-pointer"
            aria-label="Kembali ke Beranda Utama"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 p-1 flex items-center justify-center shrink-0">
            <VokaIcon className="w-full h-full object-contain" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-slate-900 leading-none">
                VokaLink
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 font-medium leading-none tracking-wide">
                SISWA
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-normal leading-none mt-0.5">
              Fase F · Target 792 JP
            </p>
          </div>
        </div>

        {/* Right side: Class info & Avatar */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/70 text-[11px] font-medium text-slate-700">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>RPL XI</span>
          </div>

          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-semibold text-[11px] flex items-center justify-center shadow-xs">
            AP
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Wifi, WifiOff } from "lucide-react";
import VokaIcon from "@/components/common/VokaIcon";

export function StudentHeader() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 pt-[env(safe-area-inset-top,0px)] transition-all">
      <div className="px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-2.5">
        {/* Brand & Left section */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/"
            title="Kembali ke Beranda Utama"
            className="w-8.5 h-8.5 min-w-[34px] rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-600 transition cursor-pointer shrink-0"
            aria-label="Kembali ke Beranda Utama"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {/* VokaIcon SVG Brand Badge */}
          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 p-1 flex items-center justify-center shrink-0">
            <VokaIcon className="w-full h-full object-contain" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm tracking-tight text-slate-900 leading-none">
                VokaLink
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 font-semibold leading-none tracking-wide">
                SISWA
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[10px] text-slate-500 font-normal leading-none truncate">
                Target 792 JP
              </p>
              <span className="text-slate-300 text-[10px]">·</span>
              <span className="inline-flex items-center gap-1 text-[9.5px] font-medium leading-none">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                <span className={isOnline ? "text-emerald-700" : "text-amber-700"}>
                  {isOnline ? "Online" : "Offline"}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Class info & Avatar */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100/90 border border-slate-200/70 text-[11px] font-semibold text-slate-700 shadow-2xs">
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="whitespace-nowrap">RPL XI</span>
          </div>

          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center shadow-xs shrink-0 select-none">
            AP
          </div>
        </div>
      </div>
    </header>
  );
}

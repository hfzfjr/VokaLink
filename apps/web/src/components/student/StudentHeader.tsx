"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Sparkles, Download } from "lucide-react";
import { cn } from "@/lib/cn";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useAuth } from "@/lib/use-auth";
import VokaIcon from "@/components/common/VokaIcon";

export function StudentHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();

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

  const isHome = pathname === "/student" || pathname === "/student/home";

  const getPageInfo = () => {
    if (pathname?.includes("/student/log/new")) {
      return { title: "Catat Jurnal", subtitle: "Input Bukti Praktik" };
    }
    if (pathname?.includes("/student/log/history")) {
      return { title: "Riwayat Logbook", subtitle: "Aktivitas & Mentor" };
    }
    if (pathname?.includes("/student/log/verify-request")) {
      return { title: "Minta Validasi", subtitle: "QR & WhatsApp Mentor" };
    }
    if (pathname?.includes("/student/career-cv")) {
      return { title: "CV ATS & Paspor", subtitle: "Portofolio Kompetensi" };
    }
    return { title: "VokaLink", subtitle: "Target 792 JP" };
  };

  const pageInfo = getPageInfo();

  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 pt-[env(safe-area-inset-top,0px)] shadow-2xs transition-all">
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left Section: Contextual Back on subpages, VokaIcon on Home */}
        <div className="flex items-center gap-2.5 min-w-0">
          {!isHome ? (
            <Link
              href="/student/home"
              title="Kembali ke Beranda Siswa"
              aria-label="Kembali ke Beranda Siswa"
              className="w-8.5 h-8.5 min-w-[34px] rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-700 transition cursor-pointer shrink-0 border border-slate-200/60"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
              <VokaIcon className="w-full h-full object-contain" />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm tracking-tight text-slate-900 leading-none truncate">
                {pageInfo.title}
              </h1>
              {isHome && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 font-semibold leading-none tracking-wide">
                  SISWA
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10.5px] text-slate-500 font-normal leading-none truncate">
                {pageInfo.subtitle}
              </span>
              <span className="text-slate-300 text-[10px]">·</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium leading-none">
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  )}
                />
                <span className={isOnline ? "text-emerald-700 font-medium" : "text-amber-700 font-medium"}>
                  {isOnline ? "Online" : "Offline"}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Install Button, Badge & Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isInstallable && !isInstalled && (
            <button
              type="button"
              onClick={promptInstall}
              title="Pasang VokaLink ke Layar Utama"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/80 text-[10.5px] font-bold shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3 h-3 stroke-[2.5]" />
              <span className="hidden xs:inline">Pasang</span>
            </button>
          )}

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100/90 border border-slate-200/70 text-[11px] font-semibold text-slate-700 shadow-2xs">
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="whitespace-nowrap">{user?.department?.sectorCode || "RPL"}</span>
          </div>

          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center shadow-xs shrink-0 select-none">
            {user?.fullName
              ? user.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              : "AP"}
          </div>
        </div>
      </div>
    </header>
  );
}

export default StudentHeader;

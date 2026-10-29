"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import VokaIcon from "@/components/common/VokaIcon";
import { Sparkles, ArrowLeft, LogOut } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/lib/cn";

export function TeacherHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isOnline = useOnlineStatus();

  const isDashboard = pathname === "/teacher/dashboard" || pathname === "/teacher";

  const teacherName = user?.fullName || "Budi Santoso, S.Kom";
  const schoolName = user?.school?.name || "SMK Telkom 1 Medan";
  const departmentName = user?.department?.name || "Rekayasa Perangkat Lunak";

  const initials = teacherName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 pt-[env(safe-area-inset-top,0px)] shadow-2xs transition-all">
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left Section: VokaIcon on Dashboard, ArrowLeft if deep */}
        <div className="flex items-center gap-2.5 min-w-0">
          {!isDashboard ? (
            <Link
              href="/teacher/dashboard"
              title="Kembali ke Beranda Guru"
              aria-label="Kembali ke Beranda Guru"
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
                {teacherName}
              </h1>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 font-semibold leading-none tracking-wide">
                GURU
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10.5px] text-slate-500 font-normal leading-none truncate">
                {schoolName} · {departmentName.includes("RPL") ? "RPL" : departmentName}
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

        {/* Right Section: Sector Badge, Avatar Initials & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100/90 border border-slate-200/70 text-[11px] font-semibold text-slate-700 shadow-2xs">
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="whitespace-nowrap">{user?.department?.sectorCode || "RPL"}</span>
          </div>

          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center shadow-xs shrink-0 select-none">
            {initials}
          </div>

          <button
            type="button"
            onClick={async () => {
              if (confirm("Apakah Anda yakin ingin keluar dari akun guru?")) {
                await logout();
                window.location.replace("/login");
              }
            }}
            title="Keluar dari Akun Guru"
            aria-label="Keluar dari Akun Guru"
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-50 active:scale-95 text-slate-500 hover:text-rose-600 flex items-center justify-center transition border border-slate-200/80 cursor-pointer shadow-2xs shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

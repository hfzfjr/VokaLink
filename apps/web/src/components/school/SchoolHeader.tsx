"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/use-auth";
import VokaIcon from "@/components/common/VokaIcon";
import { User, LogOut, X, Building2, ShieldCheck } from "lucide-react";

export function SchoolHeader() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const schoolName = user?.school?.name || "SMK Telkom 1 Medan";
  const npsn = user?.school?.npsn || "10210850";
  const adminName = user?.fullName || "Pokja PKL";
  const userInitials = adminName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 pt-[env(safe-area-inset-top,0px)] shadow-2xs transition-all">
        <div className="px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Left: Brand Icon + Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/school/dashboard"
              className="w-9 h-9 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-1.5 shrink-0"
            >
              <VokaIcon className="w-full h-full object-contain" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xs font-extrabold text-slate-900 truncate">
                {schoolName}
              </h1>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                NPSN: <span className="font-mono text-slate-500 font-semibold">{npsn}</span> &bull; {adminName}
              </p>
            </div>
          </div>

          {/* Right: Pengaturan Akun / Logout Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="h-8.5 px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5 text-slate-700 transition cursor-pointer active:scale-95"
              title="Pengaturan Akun & Keluar"
              aria-label="Pengaturan Akun & Keluar"
            >
              <span className="w-5 h-5 rounded-lg bg-sky-500 text-white flex items-center justify-center text-[10px] font-black">
                {userInitials || "A"}
              </span>
              <span className="text-xs font-bold text-slate-700">Akun</span>
            </button>
          </div>
        </div>
      </header>

      {/* Account Settings / Logout Drawer Modal (Mobile) */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black text-sm">
                  {userInitials || "A"}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-900 truncate">{adminName}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.2 rounded-md border border-sky-200/60">
                    <ShieldCheck className="w-3 h-3 text-sky-600" />
                    Admin Sekolah
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Building2 className="w-3.5 h-3.5 text-sky-500" />
                <span className="font-semibold text-slate-700">{schoolName}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                NPSN: {npsn}
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  logout();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

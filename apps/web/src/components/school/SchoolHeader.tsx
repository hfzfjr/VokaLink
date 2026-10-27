import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/use-auth";
import VokaIcon from "@/components/common/VokaIcon";

export function SchoolHeader() {
  const { user } = useAuth();

  const schoolName = user?.school?.name || "SMK Telkom 1 Medan";
  const npsn = user?.school?.npsn || "10210850";
  const adminName = user?.fullName || "Pokja PKL";

  return (
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
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-extrabold text-slate-900 truncate">
                {schoolName}
              </h1>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-sky-100 text-sky-800 leading-none shrink-0">
                SMK
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate">
              NPSN: <span className="font-mono text-slate-500 font-semibold">{npsn}</span> &bull; {adminName}
            </p>
          </div>
        </div>

        {/* Right: Multi-Tenant / Active Status Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10.5px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Fase F</span>
          </span>
        </div>
      </div>
    </header>
  );
}

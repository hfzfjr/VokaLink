"use client";

import React from "react";
import { Building2, Calendar, ShieldCheck, MapPin } from "lucide-react";
import DemoBadge from "@/components/common/DemoBadge";

interface SchoolHeroBannerProps {
  school: {
    id: string;
    npsn: string;
    name: string;
    province: string;
    city: string;
    isDemoSandbox?: boolean;
  };
  activePeriod?: {
    name: string;
    targetTotalJp: number;
    startDate?: string;
    endDate?: string;
  };
}

export function SchoolHeroBanner({ school, activePeriod }: SchoolHeroBannerProps) {
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-2xl shadow-2xs shrink-0 border border-sky-100">
          <Building2 className="w-7 h-7" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              {school.name}
            </h1>
            {school.isDemoSandbox && <DemoBadge />}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
            <span className="font-medium">
              NPSN: <span className="font-mono font-bold text-slate-700">{school.npsn}</span>
            </span>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {school.city}, {school.province}
            </span>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 text-[10px]">
              <ShieldCheck className="w-3 h-3" /> Isolasi Multi-Tenant
            </span>
          </div>
        </div>
      </div>

      {/* Active Period Badge */}
      <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center gap-3 shrink-0">
        <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800">
              {activePeriod?.name || "Periode Aktif 2026/2027"}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Target: <span className="font-bold text-sky-600">{activePeriod?.targetTotalJp ?? 792} JP</span> &bull; Fase F
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Users, Briefcase, Building2, Award } from "lucide-react";

interface SchoolKpiGridProps {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalDudis: number;
    totalPlacements: number;
  };
}

export function SchoolKpiGrid({ stats }: SchoolKpiGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      {/* 1. Siswa Aktif PKL */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Siswa PKL
          </span>
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-2xs">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tabular-nums">
            {stats.totalStudents}
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-0.5">Siswa Terdaftar</p>
        </div>
      </div>

      {/* 2. Guru Pembimbing */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Pembimbing
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
            <Briefcase className="w-4 h-4" />
          </div>
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tabular-nums">
            {stats.totalTeachers}
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-0.5">Guru Pembimbing</p>
        </div>
      </div>

      {/* 3. Mitra DUDI Aktif */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Mitra DUDI
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tabular-nums">
            {stats.totalDudis}
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-0.5">Industri Rekanan</p>
        </div>
      </div>

      {/* 4. Penempatan Aktif */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Penempatan
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-2xs">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tabular-nums">
            {stats.totalPlacements}
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-0.5">Alokasi Aktif</p>
        </div>
      </div>
    </div>
  );
}

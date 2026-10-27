"use client";

import React from "react";
import { Navigation } from "lucide-react";

interface PlacementStatsHeaderProps {
  totalStudents: number;
  unassignedCount: number;
  totalActivePlacements: number;
  remainingQuotaTotal: number;
}

export function PlacementStatsHeader({
  totalStudents,
  unassignedCount,
  totalActivePlacements,
  remainingQuotaTotal,
}: PlacementStatsHeaderProps) {
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Navigation className="w-5 h-5 text-sky-500" />
              Penempatan Siswa PKL
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Alokasikan siswa ke mitra DUDI sesuai bidang keahlian jurusan dan tugaskan guru pembimbing sekolah.
          </p>
        </div>
      </div>

      {/* 4 Summary Stat Mini Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
        <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Siswa
          </span>
          <p className="text-base sm:text-lg font-black text-slate-900 tabular-nums mt-0.5">
            {totalStudents} <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Siswa</span>
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
            Belum Ditempatkan
          </span>
          <p className="text-base sm:text-lg font-black text-amber-900 tabular-nums mt-0.5">
            {unassignedCount} <span className="text-[11px] sm:text-xs font-semibold text-amber-700/80">Siswa</span>
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
            Kapasitas Mitra DUDI
          </span>
          <p className="text-base sm:text-lg font-black text-sky-900 tabular-nums mt-0.5">
            {remainingQuotaTotal} <span className="text-[11px] sm:text-xs font-semibold text-sky-700/80">Sisa Kuota</span>
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
            Penempatan Aktif
          </span>
          <p className="text-base sm:text-lg font-black text-emerald-900 tabular-nums mt-0.5">
            {totalActivePlacements} <span className="text-[11px] sm:text-xs font-semibold text-emerald-700/80">Siswa</span>
          </p>
        </div>
      </div>
    </div>
  );
}

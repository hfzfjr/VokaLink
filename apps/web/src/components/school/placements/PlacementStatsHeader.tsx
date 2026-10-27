"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, Navigation, Sparkles } from "lucide-react";

interface PlacementStatsHeaderProps {
  totalStudents: number;
  unassignedCount: number;
  totalActivePlacements: number;
  remainingQuotaTotal: number;
  onOpenBatchModal: () => void;
}

export function PlacementStatsHeader({
  totalStudents,
  unassignedCount,
  totalActivePlacements,
  remainingQuotaTotal,
  onOpenBatchModal,
}: PlacementStatsHeaderProps) {
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            href="/school/dashboard"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dasbor</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Navigation className="w-5 h-5 text-sky-500" />
              Smart Placement PKL (FR-004)
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-xs border border-indigo-100">
              70% CP + 30% Jarak
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencocokan multi-kriteria berbasis relevansi capaian pembelajaran dan kedekatan geospasial Haversine.
          </p>
        </div>

        {unassignedCount > 0 && (
          <button
            type="button"
            onClick={onOpenBatchModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Jalankan Auto-Greedy Placement</span>
          </button>
        )}
      </div>

      {/* 4 Summary Stat Mini Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
        <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Siswa
          </span>
          <p className="text-lg font-black text-slate-900 tabular-nums mt-0.5">
            {totalStudents}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
            Belum Ditempatkan
          </span>
          <p className="text-lg font-black text-amber-900 tabular-nums mt-0.5">
            {unassignedCount} Siswa
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
            Kapasitas Mitra DUDI
          </span>
          <p className="text-lg font-black text-sky-900 tabular-nums mt-0.5">
            {remainingQuotaTotal} Sisa Kuota
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
            Penempatan Aktif
          </span>
          <p className="text-lg font-black text-emerald-900 tabular-nums mt-0.5">
            {totalActivePlacements} Siswa
          </p>
        </div>
      </div>
    </div>
  );
}

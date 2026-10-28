"use client";

import React from "react";
import { Building2, Briefcase, SearchX } from "lucide-react";
import type { PlacementRecordItem } from "@/lib/api";

interface ActivePlacementsTableProps {
  placements: PlacementRecordItem[];
  searchQuery?: string;
  hasFilter?: boolean;
  onResetFilter?: () => void;
}

export function ActivePlacementsTable({
  placements,
  searchQuery,
  hasFilter,
  onResetFilter,
}: ActivePlacementsTableProps) {
  if (placements.length === 0) {
    if (hasFilter) {
      return (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
          <SearchX className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">Penempatan Tidak Ditemukan</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `Tidak ada data penempatan aktif yang cocok dengan kata kunci "${searchQuery}".`
                : "Tidak ada data penempatan aktif pada filter yang dipilih."}
            </p>
          </div>
          {onResetFilter && (
            <button
              type="button"
              onClick={onResetFilter}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Reset Filter Pencarian
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
        <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
        <p className="text-sm font-bold text-slate-800">Belum Ada Penempatan Aktif</p>
        <p className="text-xs text-slate-400">
          Plotkan siswa ke mitra industri dari tab rekomendasi penempatan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {placements.map((p) => (
        <div
          key={p.id}
          className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-slate-300 transition"
        >
          {/* Siswa & Jurusan (Fixed width on desktop for consistent vertical alignment) */}
          <div className="space-y-1.5 min-w-0 lg:w-[320px] xl:w-[350px] shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-sm sm:text-[15px] text-slate-900 truncate">
                  {p.student.fullName}
                </span>
                <span className="px-2 py-0.2 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200/70 shrink-0">
                  Aktif
                </span>
              </div>
              <span className="font-mono text-xs text-slate-500 font-medium shrink-0">
                NISN: {p.student.identityNumber}
              </span>
            </div>

            {p.student.schoolDepartment && (
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 font-bold text-[11px] border border-sky-200/70 shrink-0">
                  {p.student.schoolDepartment.name}
                </span>
              </div>
            )}
          </div>

          {/* DUDI & Guru Pembimbing */}
          <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-0.5">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Building2 className="w-3.5 h-3.5 text-sky-500" />
                <span>Mitra Industri</span>
              </div>
              <p className="font-bold text-slate-900 truncate">{p.dudiPartner.name}</p>
              <p className="text-[11px] text-slate-500 truncate">
                Mentor: {p.dudiMentor ? p.dudiMentor.fullName : "Belum ditentukan"}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-0.5">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Briefcase className="w-3.5 h-3.5 text-sky-500" />
                <span>Guru Pembimbing</span>
              </div>
              <p className="font-bold text-slate-900 truncate">{p.teacher.fullName}</p>
              <p className="text-[11px] text-slate-500 font-mono">
                NIP: {p.teacher.identityNumber}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

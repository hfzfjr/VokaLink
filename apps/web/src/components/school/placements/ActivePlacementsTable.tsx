"use client";

import React from "react";
import { Building2, Briefcase } from "lucide-react";
import type { PlacementRecordItem } from "@/lib/api";

interface ActivePlacementsTableProps {
  placements: PlacementRecordItem[];
}

export function ActivePlacementsTable({ placements }: ActivePlacementsTableProps) {
  if (placements.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
        <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
        <p className="text-sm font-bold text-slate-800">Belum Ada Penempatan Aktif</p>
        <p className="text-xs text-slate-400">
          Plotkan siswa ke mitra industri dari tab rekomendasi atau jalankan Auto-Greedy Placement.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {placements.map((p) => (
        <div
          key={p.id}
          className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition"
        >
          {/* Siswa & Jurusan */}
          <div className="space-y-1 min-w-0 max-w-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 truncate">
                {p.student.fullName}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-100 shrink-0">
                {p.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              NISN: <span className="font-mono text-slate-700 font-semibold">{p.student.identityNumber}</span> &bull;{" "}
              {p.student.schoolDepartment?.name || "Siswa"}
            </p>
          </div>

          {/* DUDI & Guru Pembimbing */}
          <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-0.5">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Mitra Industri</span>
              </div>
              <p className="font-bold text-slate-900 truncate">{p.dudiPartner.name}</p>
              <p className="text-[10.5px] text-slate-400 truncate">
                Mentor: {p.dudiMentor ? p.dudiMentor.fullName : "Belum ditentukan"}
              </p>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-0.5">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>Guru Pembimbing</span>
              </div>
              <p className="font-bold text-slate-900 truncate">{p.teacher.fullName}</p>
              <p className="text-[10.5px] text-slate-400 font-mono">
                NIP: {p.teacher.identityNumber}
              </p>
            </div>
          </div>

          {/* Skor & Log Stats */}
          <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-0 border-slate-100 shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Skor Kompatibilitas
              </span>
              <span className="text-sm font-black text-slate-900 tabular-nums">
                {Math.round(p.compatibilityScore)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Jarak
              </span>
              <span className="text-xs font-bold text-slate-700 tabular-nums">
                {p.distanceKm} km
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

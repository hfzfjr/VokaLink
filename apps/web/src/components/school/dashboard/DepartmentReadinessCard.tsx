"use client";

import React from "react";
import { CheckCircle2, Layers } from "lucide-react";
import { TOTAL_TARGET_JP } from "@vokalink/shared";

export interface DepartmentItem {
  id: string;
  sectorCode: string;
  name: string;
  cpElementsCount: number;
  jobCardsCount: number;
  isLocked: boolean;
}

interface DepartmentReadinessCardProps {
  departments: DepartmentItem[];
}

export function DepartmentReadinessCard({ departments }: DepartmentReadinessCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
      {/* Header Card */}
      <div className="p-5 sm:p-6 pb-4 sm:pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-500" />
            Daftar Jurusan & Katalog Job Cards Aktif
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Standar Kurikulum Merdeka ({TOTAL_TARGET_JP} JP) otomatis aktif untuk setiap konsentrasi keahlian.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 self-start sm:self-auto shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Aktif Otomatis</span>
        </span>
      </div>

      {/* List Jurusan dengan full-bleed separator */}
      <div className="divide-y divide-slate-100">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="px-5 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 hover:bg-slate-50/70 transition"
          >
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm sm:text-[15px] font-bold text-slate-900 truncate">
                  {dept.name}
                </p>
                <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-600 font-extrabold text-[11px] border border-sky-100 shrink-0">
                  {dept.sectorCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {dept.cpElementsCount} Elemen CP &bull; {dept.jobCardsCount} Kartu Pekerjaan Siap Pakai
              </p>
            </div>

            {/* Hilangkan garis pemisah (border-t) di mobile */}
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-0.5 sm:pt-0">
              <span className="text-[11px] font-bold text-slate-500 tabular-nums">
                Target {TOTAL_TARGET_JP} JP
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-bold border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Siap Digunakan
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

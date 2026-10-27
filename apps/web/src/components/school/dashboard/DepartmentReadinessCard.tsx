"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Layers, ArrowRight } from "lucide-react";
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
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-500" />
            Kesiapan Matriks Kurikulum Jurusan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Target Kurikulum Merdeka {TOTAL_TARGET_JP} JP per konsentrasi keahlian.
          </p>
        </div>
        <Link
          href="/school/curriculum"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <span>Buka Kurikulum CP</span>
          <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100 overflow-hidden">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 rounded-2xl px-2 -mx-2 transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="px-2.5 py-1 rounded-xl bg-sky-50 text-sky-600 font-extrabold text-xs border border-sky-100 shrink-0">
                {dept.sectorCode}
              </span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {dept.name}
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  {dept.cpElementsCount} Elemen CP &bull; {dept.jobCardsCount} Kartu Pekerjaan
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t border-slate-100 sm:border-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 tabular-nums">
                  {TOTAL_TARGET_JP} JP
                </span>
                {dept.isLocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terkunci
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10.5px] font-bold border border-amber-200">
                    Draf
                  </span>
                )}
              </div>

              <Link
                href="/school/curriculum"
                className="inline-flex items-center gap-0.5 text-xs font-bold text-sky-600 hover:text-sky-700 transition"
              >
                <span>Detail</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

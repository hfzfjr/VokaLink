"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronDown,
} from "lucide-react";
import { TOTAL_TARGET_JP } from "@vokalink/shared";

interface DepartmentOption {
  id: string;
  sectorCode: string;
  name: string;
}

interface CurriculumHeaderProps {
  departments: DepartmentOption[];
  selectedDeptId: string;
  onSelectDepartment: (id: string) => void;
  isLocked: boolean;
  currentTotalJp: number;
  onOpenLockModal: () => void;
  locking?: boolean;
}

export function CurriculumHeader({
  departments,
  selectedDeptId,
  onSelectDepartment,
  isLocked,
  currentTotalJp,
  onOpenLockModal,
  locking = false,
}: CurriculumHeaderProps) {
  const delta = TOTAL_TARGET_JP - currentTotalJp;
  const isExact = delta === 0;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Breadcrumb + Title */}
        <div>
          <Link
            href="/school/dashboard"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dasbor</span>
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-500" />
              Matriks Kurikulum & Kartu Kerja
            </h1>
            {isLocked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                <Lock className="w-3 h-3 text-emerald-600" /> Kurikulum Terkunci
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200">
                <Unlock className="w-3 h-3 text-amber-600" /> Mode Draf
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi Elemen Capaian Pembelajaran (CP) dan Katalog Kartu Pekerjaan (Job Cards).
          </p>
        </div>

        {/* Lock Curriculum Action Button */}
        {!isLocked && (
          <button
            type="button"
            onClick={onOpenLockModal}
            disabled={!isExact || locking}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              isExact
                ? "bg-slate-900 hover:bg-slate-800 text-white active:scale-95"
                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
            }`}
            title={!isExact ? `Total JP harus tepat ${TOTAL_TARGET_JP} JP untuk dapat dikunci` : undefined}
          >
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span>Kunci Kurikulum Jurusan</span>
          </button>
        )}
      </div>

      {/* Department Selector & JP Target Indicator */}
      <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Dropdown Jurusan */}
        <div className="flex items-center gap-2 min-w-0">
          <label className="text-xs font-bold text-slate-700 shrink-0">Pilih Jurusan:</label>
          <div className="relative inline-block max-w-xs w-full">
            <select
              value={selectedDeptId}
              onChange={(e) => onSelectDepartment(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
            >
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  [{dept.sectorCode}] {dept.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* JP Target Counter Bar */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                {currentTotalJp} / {TOTAL_TARGET_JP} JP
              </span>
              {isExact ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Genap
                </span>
              ) : delta > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                  <AlertTriangle className="w-3 h-3 text-amber-600" /> Kurang {delta} JP
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                  <AlertTriangle className="w-3 h-3 text-rose-600" /> Kelebihan {Math.abs(delta)} JP
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Standar 1 Semester (6 Bulan) PKL SMK
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

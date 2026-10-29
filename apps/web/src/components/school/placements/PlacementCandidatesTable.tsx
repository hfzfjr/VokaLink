"use client";

import React from "react";
import {
  Sparkles,
  UserCheck,
  CheckCircle2,
  SearchX,
} from "lucide-react";
import type { PlacementCandidateStudent } from "@/lib/api";

interface PlacementCandidatesTableProps {
  students: PlacementCandidateStudent[];
  searchQuery?: string;
  hasFilter?: boolean;
  onOpenAssignModal: (student: PlacementCandidateStudent) => void;
  onResetFilter?: () => void;
}

export function PlacementCandidatesTable({
  students,
  searchQuery,
  hasFilter,
  onOpenAssignModal,
  onResetFilter,
}: PlacementCandidatesTableProps) {
  if (students.length === 0) {
    if (hasFilter) {
      return (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
          <SearchX className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">Siswa Tidak Ditemukan</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `Tidak ada siswa yang cocok dengan kata kunci "${searchQuery}".`
                : "Tidak ada siswa pada filter jurusan yang dipilih."}
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
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
        <p className="text-sm font-bold text-slate-800">Semua Siswa Telah Ditempatkan</p>
        <p className="text-xs text-slate-400">
          Seluruh siswa aktif telah memiliki alokasi tempat PKL di mitra industri.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {students.map((student) => {
        const bestRec = student.bestRecommendation;
        const score = bestRec ? Math.round(bestRec.competencyScore) : 0;

        const scoreBadgeClass =
          score >= 75
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : score >= 40
            ? "bg-sky-50 text-sky-700 border-sky-200"
            : score > 0
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-slate-100 text-slate-600 border-slate-200";

        return (
          <div
            key={student.studentId}
            className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-slate-300 transition"
          >
            {/* Col 1: Student Info (Fixed width on desktop for consistent alignment) */}
            <div className="space-y-1.5 min-w-0 lg:w-[320px] xl:w-[350px] shrink-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm sm:text-[15px] text-slate-900 truncate">
                  {student.fullName}
                </span>
                <span className="font-mono text-xs text-slate-500 font-medium shrink-0">
                  NISN: {student.identityNumber}
                </span>
              </div>

              {student.department && (
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 font-bold text-[11px] border border-sky-200/70 shrink-0">
                    {student.department.name}
                  </span>
                </div>
              )}
            </div>

            {/* Col 2: Rekomendasi Mitra DUDI Sesuai Jurusan (Consistent flex-1 width) */}
            <div className="flex-1 min-w-0">
              {bestRec ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Sparkles className="w-4 h-4 text-sky-500 shrink-0" />
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {bestRec.dudiName}
                      </div>
                      <div className="text-xs text-slate-500">
                        <span>
                          Sisa Kuota Mitra:{" "}
                          {bestRec.remainingQuota > 0 ? (
                            <strong className="text-emerald-700">{bestRec.remainingQuota} kursi tersedia</strong>
                          ) : (
                            <strong className="text-slate-600">Pilih mitra tersedia saat plot</strong>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center justify-center text-center whitespace-nowrap px-3 py-1 rounded-full font-bold text-xs border shrink-0 tabular-nums self-start sm:self-center ${scoreBadgeClass}`}
                  >
                    {score > 0 ? `Kesesuaian ${score}%` : "Rekomendasi Mitra"}
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <p className="text-xs text-slate-500">
                    Pilih mitra DUDI yang tersedia melalui tombol Plotkan Siswa.
                  </p>
                </div>
              )}
            </div>

            {/* Col 3: Action (Fixed width on desktop, full width on mobile/tablet) */}
            <div className="shrink-0 flex items-center justify-end w-full lg:w-[145px]">
              <button
                type="button"
                onClick={() => onOpenAssignModal(student)}
                className="w-full lg:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              >
                <UserCheck className="w-4 h-4" />
                <span>Plotkan Siswa</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

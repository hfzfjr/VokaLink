"use client";

import React from "react";
import {
  GraduationCap,
  AlertTriangle,
  Edit3,
} from "lucide-react";
import type { EraporStudentRecord } from "@/lib/api";
import { TOTAL_TARGET_JP } from "@vokalink/shared";

interface EraporDataTableProps {
  records: EraporStudentRecord[];
  onOpenDetail: (record: EraporStudentRecord) => void;
}

export function EraporDataTable({ records, onOpenDetail }: EraporDataTableProps) {
  if (records.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
        <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
        <p className="text-sm font-bold text-slate-800">Tidak Ada Rekap Nilai Siswa</p>
        <p className="text-xs text-slate-400">
          Ubah filter pencarian atau pastikan siswa telah memiliki penempatan aktif.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((r) => {
        const grade = Math.round(r.finalGrade);
        const hasVerifiedJp = r.totalVerifiedJp > 0 || grade > 0;
        const predicate =
          grade >= 85 ? "A" : grade >= 75 ? "B" : grade >= 60 ? "C" : "D";

        const predicateBadgeClass = !hasVerifiedJp
          ? "bg-slate-100 text-slate-600 border-slate-200"
          : predicate === "A"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : predicate === "B"
          ? "bg-sky-50 text-sky-700 border-sky-200"
          : predicate === "C"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-slate-100 text-slate-700 border-slate-200";

        return (
          <div
            key={r.placementId}
            className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition"
          >
            {/* Col 1: Student & DUDI Info (Fixed width on desktop for straight vertical alignment) */}
            <div className="space-y-1.5 min-w-0 md:w-[320px] lg:w-[350px] shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-[15px] text-slate-900 truncate">
                  {r.student.fullName}
                </span>
                {r.student.department && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-700 font-bold text-[11px] border border-sky-200/70 shrink-0">
                    {r.student.department.name}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 truncate">
                NISN: <span className="font-mono text-slate-700 font-semibold">{r.student.identityNumber}</span> &bull;{" "}
                Mitra: <strong className="text-slate-800">{r.dudiPartner.name}</strong>
              </p>

              {r.pendingLogsCount > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 font-bold text-[11px] border border-amber-200/80">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{r.pendingLogsCount} Jurnal Menunggu Verifikasi</span>
                </div>
              )}
            </div>

            {/* Col 2: JP & Narasi Capaian (Consistent flex-1 inner card) */}
            <div className="flex-1 min-w-0">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 font-semibold">Realisasi Jam PKL:</span>
                  <span className="font-bold text-slate-900 tabular-nums bg-white px-2.5 py-0.5 rounded-lg border border-slate-200/80">
                    {r.totalVerifiedJp} / {TOTAL_TARGET_JP} JP
                  </span>
                </div>

                {hasVerifiedJp ? (
                  <p className="text-xs text-slate-600 line-clamp-1">
                    <strong className="text-slate-800">Catatan:</strong>{" "}
                    {r.highestAchievement || "Menjalankan penugasan sesuai standar operasional mitra industri."}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    Belum ada jurnal kegiatan yang disahkan oleh mentor industri.
                  </p>
                )}
              </div>
            </div>

            {/* Col 3: Nilai Akhir & Detail Trigger (Fixed width on desktop) */}
            <div className="flex items-center justify-between md:justify-end gap-3.5 pt-1.5 md:pt-0 shrink-0 md:w-[255px]">
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nilai Akhir
                </span>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-lg font-black text-slate-900 tabular-nums leading-none">
                    {grade}
                  </span>
                  <span
                    className={`inline-flex items-center justify-center text-center whitespace-nowrap px-2.5 py-1 rounded-lg font-bold text-xs border leading-none ${predicateBadgeClass}`}
                  >
                    {hasVerifiedJp ? `Predikat ${predicate}` : "Belum Dinilai"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenDetail(r)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Rincian</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

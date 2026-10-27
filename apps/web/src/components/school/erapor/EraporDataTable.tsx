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
        const grade = r.finalGrade;
        const predicate =
          grade >= 85 ? "A" : grade >= 75 ? "B" : grade >= 60 ? "C" : "D";

        return (
          <div
            key={r.placementId}
            className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition"
          >
            {/* Student & DUDI Info */}
            <div className="space-y-1.5 min-w-0 max-w-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-900 truncate">
                  {r.student.fullName}
                </span>
                {r.student.department && (
                  <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-extrabold text-[10px] border border-sky-100 shrink-0">
                    {r.student.department.name}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500">
                NISN: <span className="font-mono text-slate-700 font-semibold">{r.student.identityNumber}</span> &bull;{" "}
                Mitra: <strong className="text-slate-800">{r.dudiPartner.name}</strong>
              </p>

              {r.pendingLogsCount > 0 && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>{r.pendingLogsCount} Log Belum Diverifikasi Mentor</span>
                </div>
              )}
            </div>

            {/* JP & Narasi Capaian */}
            <div className="flex-1 min-w-0 md:px-4 space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Jam Tervalidasi:</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {r.totalVerifiedJp} / {TOTAL_TARGET_JP} JP
                </span>
              </div>

              {r.highestAchievement && (
                <p className="text-[11px] text-slate-600 line-clamp-1">
                  <strong className="text-emerald-700">Capaian:</strong> {r.highestAchievement}
                </p>
              )}

              {r.needsImprovement && (
                <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                  <strong className="text-amber-700">Peningkatan:</strong> {r.needsImprovement}
                </p>
              )}
            </div>

            {/* Nilai Akhir & Detail Trigger */}
            <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-0 border-slate-100 shrink-0">
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nilai Akhir
                </span>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-lg font-black text-slate-900 tabular-nums">
                    {Math.round(r.finalGrade)}
                  </span>
                  <span
                    className={`px-2 py-0.2 rounded-md font-black text-xs ${
                      predicate === "A"
                        ? "bg-emerald-100 text-emerald-800"
                        : predicate === "B"
                        ? "bg-sky-100 text-sky-800"
                        : predicate === "C"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    Predikat {predicate}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenDetail(r)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
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

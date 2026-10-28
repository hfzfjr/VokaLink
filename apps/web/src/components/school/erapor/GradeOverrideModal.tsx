"use client";

import React from "react";
import { X, GraduationCap, AlertCircle, CheckCircle2 } from "lucide-react";
import type { EraporStudentRecord } from "@/lib/api";

interface GradeOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: EraporStudentRecord | null;
}

export function GradeOverrideModal({
  isOpen,
  onClose,
  record,
}: GradeOverrideModalProps) {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Rincian Nilai e-Rapor Siswa</h3>
              <p className="text-[11px] text-slate-500 truncate max-w-xs">{record.student.fullName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto text-xs">
          {/* Student Overview Strip */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900 text-sm">{record.student.fullName}</p>
              <p className="text-slate-500 text-[11px]">
                NISN: {record.student.identityNumber} &bull; Jurusan: {record.student.department?.name || "-"}
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Mitra: <strong className="text-slate-700">{record.dudiPartner.name}</strong> &bull; Guru: {record.teacher.fullName}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Nilai Akhir
              </span>
              <span className="text-2xl font-black text-slate-900 tabular-nums">
                {Math.round(record.finalGrade)}
              </span>
            </div>
          </div>

          {/* Breakdown Capaian per Elemen CP */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Capaian Otonomi per Elemen CP
            </p>
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 overflow-hidden">
              {record.elements.map((el) => (
                <div key={el.elementId} className="p-3 bg-white flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded-md bg-sky-50 text-sky-700 font-extrabold text-[10px] border border-sky-100 shrink-0">
                        {el.elementCode}
                      </span>
                      <p className="font-bold text-slate-900 truncate">{el.elementTitle}</p>
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">
                      Target: {el.targetJp} JP &bull; Tervalidasi: <strong className="text-slate-700">{el.verifiedJp} JP</strong>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 tabular-nums">
                      {Math.round(el.score)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Otonomi: {Math.round(el.autonomyScore)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deskripsi Narasi Resmi */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Deskripsi Naratif Resmi Rapor
            </p>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 space-y-1">
              <span className="font-bold text-emerald-900 text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Capaian Kompetensi Tertinggi
              </span>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                {record.highestAchievement || "Menunjukkan penguasaan kompetensi yang konsisten sepanjang pelaksanaan PKL."}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-1">
              <span className="font-bold text-amber-900 text-[11px] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Hal yang Perlu Ditingkatkan
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {record.needsImprovement || "Perlu penguatan kemandirian dan konsistensi pendokumentasian bukti kerja."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            Tutup Rincian
          </button>
        </div>
      </div>
    </div>
  );
}

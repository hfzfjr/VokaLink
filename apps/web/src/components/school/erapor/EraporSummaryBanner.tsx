"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";

interface EraporSummaryBannerProps {
  totalStudents: number;
  studentsWithPendingLogsCount: number;
  averageGrade: number;
}

export function EraporSummaryBanner({
  totalStudents,
  studentsWithPendingLogsCount,
  averageGrade,
}: EraporSummaryBannerProps) {
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
      {/* Title & Description */}
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
            <FileSpreadsheet className="w-5 h-5 text-amber-500" />
            Rekapitulasi Nilai e-Rapor SMK
          </h1>
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-extrabold text-xs border border-amber-200">
            FR-011 Kemendikbudristek
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Perhitungan otomatis bobot kemandirian per Elemen CP dan ekspor berkas CSV siap impor ke aplikasi e-Rapor Dapodik.
        </p>
      </div>

      {/* Warning Banner if pending logs exist */}
      {studentsWithPendingLogsCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-amber-900">
              Perhatian: {studentsWithPendingLogsCount} siswa masih memiliki catatan log yang belum diverifikasi mentor!
            </p>
            <p className="text-amber-700 text-[11px] leading-relaxed">
              Sesuai aturan bisnis <strong className="font-semibold">BR-010</strong>, hanya log harian berstatus <strong className="font-semibold text-emerald-800">VERIFIED</strong> yang masuk ke dalam akumulasi JP dan penilaian e-Rapor. Segera ingatkan mentor industri untuk menyelesaikan verifikasi jurnal.
            </p>
          </div>
        </div>
      )}

      {/* 4 Summary Metric Mini Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
        <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Siswa Terdata
          </span>
          <p className="text-lg font-black text-slate-900 tabular-nums mt-0.5">
            {totalStudents} Siswa
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
            Menunggu Verifikasi
          </span>
          <p className="text-lg font-black text-amber-900 tabular-nums mt-0.5">
            {studentsWithPendingLogsCount} Siswa
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
            Rerata Nilai Akhir
          </span>
          <p className="text-lg font-black text-emerald-900 tabular-nums mt-0.5">
            {averageGrade > 0 ? averageGrade.toFixed(1) : 0}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
            Format Ekspor
          </span>
          <p className="text-lg font-black text-sky-900 mt-0.5">
            CSV Dapodik
          </p>
        </div>
      </div>
    </div>
  );
}

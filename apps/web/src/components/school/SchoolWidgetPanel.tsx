"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  FileSpreadsheet,
  Navigation,
  ArrowRight,
  School,
  Sparkles,
} from "lucide-react";
import { TOTAL_TARGET_JP } from "@vokalink/shared";

interface SchoolWidgetPanelProps {
  schoolName?: string;
  npsn?: string;
  adminName?: string;
  activePeriodName?: string;
  totalStudents?: number;
  totalPlacements?: number;
  totalDudis?: number;
  departmentsCount?: number;
  lockedDepartmentsCount?: number;
}

export function SchoolWidgetPanel({
  schoolName = "SMK Telkom 1 Medan",
  npsn = "10210850",
  adminName = "Pokja PKL",
  activePeriodName = "Periode Aktif 2026/2027",
  totalStudents = 148,
  totalPlacements = 142,
  totalDudis: _totalDudis = 24,
  departmentsCount = 6,
  lockedDepartmentsCount = 6,
}: SchoolWidgetPanelProps) {
  const placementRate = totalStudents > 0 ? Math.round((totalPlacements / totalStudents) * 100) : 0;
  const curriculumReady = lockedDepartmentsCount === departmentsCount;

  return (
    <aside className="w-full lg:w-[320px] xl:w-[340px] 2xl:w-[360px] flex flex-col gap-4 shrink-0">
      {/* 1. Profile Card Header (Desktop) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
            <School className="w-6 h-6" />
          </div>
          <div className="truncate min-w-0">
            <h2 className="text-sm font-black text-slate-900 tracking-tight truncate">
              {schoolName}
            </h2>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              NPSN: <span className="font-mono text-slate-700 font-semibold">{npsn}</span>
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold text-[10px] border border-sky-100">
                Pengelola PKL
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                &bull; {adminName}
              </span>
            </div>
          </div>
        </div>

        {/* Periode Akademik Strip */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="font-bold text-slate-800 text-[11px] truncate">
              {activePeriodName}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Aktif
          </span>
        </div>
      </div>

      {/* 2. Ringkasan Kesiapan Kurikulum & Penempatan */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            Kesiapan Operasional
          </h3>
          <span className="text-[11px] font-bold text-slate-500">
            Target {TOTAL_TARGET_JP} JP
          </span>
        </div>

        {/* Progress Kurikulum Terkunci */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Kurikulum Jurusan</span>
            <span className="font-black text-slate-900 tabular-nums">
              {lockedDepartmentsCount} / {departmentsCount} Jurusan
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                curriculumReady ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{
                width: `${departmentsCount > 0 ? (lockedDepartmentsCount / departmentsCount) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            {curriculumReady
              ? "Semua konsentrasi keahlian telah dikunci (792 JP)"
              : "Ada jurusan yang masih dalam status Draf"}
          </p>
        </div>

        {/* Progress Penempatan Siswa */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Rasio Penempatan</span>
            <span className="font-black text-slate-900 tabular-nums">
              {placementRate}% ({totalPlacements}/{totalStudents})
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-sky-500 transition-all duration-500"
              style={{ width: `${Math.min(100, placementRate)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            {totalStudents - totalPlacements > 0
              ? `${totalStudents - totalPlacements} siswa siap dialokasikan lewat Smart Placement`
              : "Seluruh siswa telah terhubung dengan mitra DUDI"}
          </p>
        </div>
      </div>

      {/* 3. Aksi Cepat Pengelola (Quick Actions) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Tindakan Cepat
        </h3>

        <div className="space-y-2">
          <Link
            href="/school/placements"
            className="w-full p-3 rounded-2xl bg-sky-50/70 hover:bg-sky-100/70 border border-sky-100 flex items-center justify-between transition group text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="truncate min-w-0">
                <p className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition">
                  Jalankan Smart Placement
                </p>
                <p className="text-[10px] text-slate-500">Pencocokan 70% CP + 30% Jarak</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-sky-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>

          <Link
            href="/school/dudi-directory"
            className="w-full p-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-100 flex items-center justify-between transition group text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="truncate min-w-0">
                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                  Registrasi Mitra DUDI
                </p>
                <p className="text-[10px] text-slate-500">Kemitraan & QR Aktivasi Mentor</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>

          <Link
            href="/school/erapor"
            className="w-full p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-100 flex items-center justify-between transition group text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="truncate min-w-0">
                <p className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition">
                  Unduh Rekap e-Rapor
                </p>
                <p className="text-[10px] text-slate-500">Format CSV Resmi Kemendikbud</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

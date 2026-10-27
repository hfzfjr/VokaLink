"use client";

import React from "react";
import Link from "next/link";
import {
  Bell,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Award,
  ChevronRight,
  Flame,
  CheckCircle2,
  Users,
} from "lucide-react";

export interface PriorityStudentWatchItem {
  studentId: string;
  name: string;
  dudiName: string;
  alertReason: string;
  alertType: string;
  onIntervene?: () => void;
}

interface TeacherWidgetPanelProps {
  teacherName?: string;
  schoolName?: string;
  departmentName?: string;
  averagePercentage?: number;
  totalStudents?: number;
  driftCount?: number;
  securityFlagsCount?: number;
  priorityStudents?: PriorityStudentWatchItem[];
  onTriggerEvaluate?: () => void;
  isEvaluating?: boolean;
}

export function TeacherWidgetPanel({
  teacherName = "Budi Santoso, S.Kom",
  schoolName = "SMK Telkom 1 Medan",
  departmentName = "Rekayasa Perangkat Lunak",
  averagePercentage = 68,
  totalStudents = 4,
  driftCount = 0,
  securityFlagsCount = 0,
  priorityStudents = [],
  onTriggerEvaluate,
  isEvaluating = false,
}: TeacherWidgetPanelProps) {
  const initials = teacherName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const targetJp = 792;
  const averageJp = Math.round((averagePercentage / 100) * targetJp);

  return (
    <aside className="w-full lg:w-[320px] xl:w-[340px] 2xl:w-[360px] flex flex-col gap-4 flex-shrink-0">
      {/* ─── 1. Profile Card Header (Desktop) ─── */}
      <div className="hidden lg:flex lg:h-[86px] bg-white rounded-2xl px-5 border border-slate-200/70 shadow-2xs items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            {initials}
          </div>
          <div className="truncate min-w-0">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight truncate">
              {teacherName}
            </h2>
            <p className="text-xs text-slate-500 font-normal truncate mt-0.5">
              {schoolName}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] tracking-wide leading-none">
                {departmentName.includes("RPL") ? "RPL (Fase F)" : departmentName}
              </span>
              <span className="text-[11px] text-slate-400 font-normal truncate leading-none">
                &bull; Pembimbing
              </span>
            </div>
          </div>
        </div>

        {/* Action Scan / Refresh */}
        {onTriggerEvaluate && (
          <button
            type="button"
            onClick={onTriggerEvaluate}
            disabled={isEvaluating}
            title="Pindai Algoritma Drift Sekarang"
            className="w-9 h-9 rounded-xl bg-slate-100/80 hover:bg-slate-200/60 border border-slate-200/70 flex items-center justify-center text-slate-600 transition cursor-pointer shrink-0 ml-2 shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isEvaluating ? "animate-spin text-sky-600" : ""}`} />
          </button>
        )}
      </div>

      {/* ─── 2. Target Capaian Rata-Rata Kelas (792 JP) ─── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase">
            Rata-Rata Capaian Kelas
          </h3>
          <span className="text-xs font-bold text-sky-600 tabular-nums">
            {averagePercentage}%
          </span>
        </div>

        <div className="flex items-baseline gap-1.5 tabular-nums">
          <span className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
            {averageJp}
          </span>
          <span className="text-xs text-slate-400 font-normal">/ 792 JP Target Kelulusan</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex gap-0.5 p-0.5">
          <div
            style={{ width: `${Math.min(100, averagePercentage)}%` }}
            className={`h-full rounded-full transition-all duration-500 ${
              averagePercentage >= 75 ? "bg-emerald-500" : "bg-sky-500"
            }`}
          />
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2 text-[11px] pt-0.5">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Tuntas <strong className="text-slate-900 tabular-nums">&ge;75%</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
            <span>Aktif <strong className="text-slate-900 tabular-nums">{totalStudents}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 justify-end">
            <span className={`w-2 h-2 rounded-full shrink-0 ${driftCount > 0 ? "bg-rose-500 animate-pulse" : "bg-slate-300"}`} />
            <span>Drift <strong className="text-slate-900 tabular-nums">{driftCount}</strong></span>
          </div>
        </div>
      </div>

      {/* ─── 3. Pantauan Anomali Mendesak (Drift Watchlist) ─── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Pantauan Anomali Siswa
            </h3>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
            {driftCount} Kasus
          </span>
        </div>

        {priorityStudents.length === 0 ? (
          <div className="py-4 text-center space-y-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-800">Semua Siswa Terverifikasi Normal</p>
            <p className="text-[11px] text-slate-400">Tidak ada deviasi kurikulum yang melewati ambang batas.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {priorityStudents.slice(0, 3).map((item) => (
              <div
                key={item.studentId}
                className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 space-y-1.5 hover:bg-slate-100/70 transition"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.dudiName}</p>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 shrink-0">
                    {item.alertType.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {item.alertReason}
                </p>
                {item.onIntervene && (
                  <button
                    type="button"
                    onClick={item.onIntervene}
                    className="w-full mt-1 py-1.5 rounded-full bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10.5px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Tindak Lanjuti via WhatsApp</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── 4. Audit Integritas Data & Keamanan ─── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Audit Integritas Data
            </h3>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            Segel Sah
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 text-xs space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Insiden Audit Aktif:</span>
            <span className={`font-bold ${securityFlagsCount > 0 ? "text-rose-600" : "text-emerald-700"}`}>
              {securityFlagsCount > 0 ? `${securityFlagsCount} Perlu Review` : "0 (Aman)"}
            </span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-200/50">
            <span className="text-slate-500">Verifikasi Mentor:</span>
            <span className="font-medium text-slate-800">Device Token + PIN</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-200/50">
            <span className="text-slate-500">Segel Digital:</span>
            <span className="font-medium text-slate-800">HMAC-SHA256 Valid</span>
          </div>
        </div>
      </div>

      {/* ─── 5. Pintasan Paspor Kompetensi Digital Siswa ─── */}
      <Link
        href="/verify/andi-pratama"
        target="_blank"
        className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs hover:border-sky-300 transition-colors group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 group-hover:text-sky-600 transition-colors truncate">
              Paspor Kompetensi Digital
            </p>
            <p className="text-[11px] text-slate-500 truncate">Pratinjau portofolio resmi ber-QR</p>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0" />
      </Link>
    </aside>
  );
}

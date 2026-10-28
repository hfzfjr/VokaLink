"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Award,
  CheckCircle2,
  Bell,
  Flame,
  Check,
} from "lucide-react";
import { cn } from "@/lib/cn";

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
  achievedCount?: number;
  driftCount?: number;
  securityFlagsCount?: number;
  priorityStudents?: PriorityStudentWatchItem[];
  samplePassportSlug?: string;
  onViewSecurityAudit?: () => void;
  onOpenNotifications?: () => void;
}

export function TeacherWidgetPanel({
  teacherName = "Budi Santoso, S.Kom",
  schoolName = "SMK Telkom 1 Medan",
  departmentName = "Rekayasa Perangkat Lunak",
  averagePercentage = 68,
  totalStudents = 4,
  achievedCount = 0,
  driftCount = 0,
  securityFlagsCount = 0,
  priorityStudents = [],
  samplePassportSlug,
  onViewSecurityAudit,
  onOpenNotifications,
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
      <div className="hidden lg:flex lg:h-[86px] bg-white rounded-2xl px-4 sm:px-5 border border-slate-200/70 shadow-2xs items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-semibold text-xs shadow-xs shrink-0">
            {initials}
          </div>
          <div className="truncate min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight truncate">
              {teacherName}
            </h2>
            <p className="text-xs text-slate-500 font-normal truncate mt-0.5">
              {schoolName}
            </p>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <span
                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] tracking-wide leading-none truncate max-w-[160px]"
                title={departmentName}
              >
                {departmentName.includes("RPL") ? "RPL (Fase F)" : departmentName}
              </span>
              <span className="text-[10px] text-slate-500 font-medium leading-none shrink-0">
                · Pembimbing
              </span>
            </div>
          </div>
        </div>

        {/* Bell Icon Notification Button */}
        <button
          type="button"
          onClick={onOpenNotifications || onViewSecurityAudit}
          title="Notifikasi & Peringatan Drift"
          className="w-9 h-9 rounded-xl bg-slate-100/80 hover:bg-slate-200/60 border border-slate-200/70 flex items-center justify-center text-slate-600 transition relative cursor-pointer shrink-0 ml-2"
        >
          <Bell className="w-4 h-4" />
          {driftCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white" />
          )}
        </button>
      </div>

      {/* ─── 2. Target Capaian Rata-Rata Kelas (792 JP) ─── */}
      <div className="hidden lg:block bg-white rounded-2xl p-4 border border-slate-200/70 shadow-card space-y-3">
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
          <span className="text-xs text-slate-500 font-normal">/ 792 JP Target Kelulusan</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex gap-0.5 p-0.5">
          <div
            style={{ width: `${Math.min(100, averagePercentage)}%` }}
            className={cn(
              "h-full rounded-full transition-all duration-500",
              averagePercentage >= 75 ? "bg-emerald-500" : "bg-sky-500"
            )}
          />
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2 text-[11px] pt-0.5">
          <div className="flex items-center gap-1.5 text-slate-600" title="Siswa dengan capaian >= 75%">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>
              Tuntas <strong className="text-slate-900 tabular-nums">{achievedCount}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600" title="Total siswa terdaftar">
            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
            <span>
              Aktif <strong className="text-slate-900 tabular-nums">{totalStudents}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 justify-end" title="Siswa terdeteksi deviasi drift">
            <span
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                driftCount > 0 ? "bg-rose-500 animate-pulse" : "bg-slate-300"
              )}
            />
            <span>
              Drift <strong className="text-slate-900 tabular-nums">{driftCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ─── 3. Presensi & Monitoring Kelas Pekan Ini ─── */}
      <div className="hidden lg:block bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card space-y-3">
        <div className="flex items-center justify-between gap-2 pb-0.5">
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase whitespace-nowrap">
              Presensi Siswa Pekan Ini
            </h3>
            <p className="text-[11px] text-slate-500 font-normal truncate">
              Pekan Aktif · 5 Hari Kerja
            </p>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[10.5px] font-bold shrink-0 whitespace-nowrap shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <span>Fase F</span>
          </div>
        </div>

        {/* 5 Workdays Progress Strip (Sen - Jum) */}
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
          {[
            { day: "Sen", count: totalStudents, status: "verified", label: "Tercatat" },
            { day: "Sel", count: totalStudents, status: "verified", label: "Tercatat" },
            { day: "Rab", count: totalStudents, status: "verified", label: "Tercatat" },
            { day: "Kam", count: totalStudents, status: "verified", label: "Tercatat" },
            { day: "Jum", count: totalStudents, status: "today", label: "Hari Ini" },
          ].map((d) => {
            const isToday = d.status === "today";
            return (
              <div
                key={d.day}
                className={`flex flex-col items-center justify-between py-1.5 sm:py-2 px-0.5 sm:px-1 rounded-xl border transition-all text-center ${
                  isToday
                    ? "bg-sky-50/80 border-sky-400 ring-2 ring-sky-500/15 shadow-2xs"
                    : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70"
                }`}
              >
                <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${isToday ? "text-sky-700" : "text-slate-400"}`}>
                  {d.day}
                </span>
                <span
                  className={`text-[11px] sm:text-xs font-bold my-0.5 sm:my-1 tracking-tight ${
                    isToday ? "text-sky-600" : "text-slate-900"
                  }`}
                >
                  {d.count} <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400">Siswa</span>
                </span>
                <div className="mt-0.5">
                  {isToday ? (
                    <span className="inline-block px-1 sm:px-1.5 py-0.5 rounded-full bg-sky-500 text-white text-[8.5px] sm:text-[9px] font-bold leading-none whitespace-nowrap shadow-2xs">
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[8.5px] sm:text-[9px] font-bold leading-none whitespace-nowrap">
                      <Check className="w-2 sm:w-2.5 h-2 sm:h-2.5 stroke-[2.5] text-emerald-600 shrink-0" />
                      <span>{d.count} Log</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Summary Metrics */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between text-xs gap-2">
          <div className="min-w-0">
            <span className="text-[9.5px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Disiplin Jurnal
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight whitespace-nowrap">
                {totalStudents} Siswa Teratur
              </span>
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/80 text-[9.5px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                100%
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[9.5px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Status Anomali
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold mt-0.5 whitespace-nowrap",
                driftCount > 0 ? "text-rose-600" : "text-emerald-700"
              )}
            >
              {driftCount > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>{driftCount} Kasus Drift</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Nir-Anomali</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 4. Pantauan Anomali Siswa (Drift Watchlist) ─── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-card space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldAlert
              className={cn(
                "w-4 h-4",
                driftCount > 0 ? "text-rose-500 animate-pulse" : "text-slate-400"
              )}
            />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Pantauan Anomali Siswa
            </h3>
          </div>
          <span
            className={cn(
              "text-[11px] font-bold px-2 py-0.5 rounded-full border",
              driftCount > 0
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            )}
          >
            {driftCount > 0 ? `${driftCount} Kasus` : "0 Kasus (Aman)"}
          </span>
        </div>

        {priorityStudents.length === 0 ? (
          <div className="py-4 text-center space-y-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-800">Semua Siswa Terverifikasi Normal</p>
            <p className="text-[11px] text-slate-500 font-normal">
              Tidak ada deviasi kurikulum yang melewati ambang batas.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {priorityStudents.slice(0, 3).map((item) => (
              <div
                key={item.studentId}
                className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1.5 hover:bg-slate-100/70 transition"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{item.dudiName}</p>
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

      {/* ─── 5. Audit Integritas Data & Keamanan ─── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck
              className={cn(
                "w-4 h-4",
                securityFlagsCount > 0 ? "text-amber-500" : "text-emerald-500"
              )}
            />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Audit Integritas Data
            </h3>
          </div>
          <span
            className={cn(
              "text-[11px] font-bold px-2 py-0.5 rounded-full border",
              securityFlagsCount > 0
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            )}
          >
            {securityFlagsCount > 0 ? `${securityFlagsCount} Perlu Ditinjau` : "Segel Sah"}
          </span>
        </div>

        <div
          onClick={onViewSecurityAudit}
          className={cn(
            "p-3 rounded-xl border text-xs space-y-1.5 transition",
            onViewSecurityAudit ? "cursor-pointer hover:bg-slate-100" : "",
            securityFlagsCount > 0
              ? "bg-amber-50/60 border-amber-200"
              : "bg-slate-50 border-slate-200"
          )}
          title={onViewSecurityAudit ? "Klik untuk membuka rincian audit validasi" : undefined}
        >
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Insiden Audit Aktif:</span>
            <span
              className={cn(
                "font-bold flex items-center gap-1",
                securityFlagsCount > 0 ? "text-rose-600" : "text-emerald-700"
              )}
            >
              {securityFlagsCount > 0 ? `${securityFlagsCount} Perlu Ditinjau` : "0 (Aman)"}
              {onViewSecurityAudit && securityFlagsCount > 0 && (
                <span className="text-[10px] underline ml-1 font-semibold text-rose-600">
                  Lihat
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-200">
            <span className="text-slate-500">Verifikasi Mentor:</span>
            <span className="font-medium text-slate-800">Device Token + PIN</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-200">
            <span className="text-slate-500">Segel Digital:</span>
            <span className="font-medium text-slate-800">HMAC-SHA256 Valid</span>
          </div>
        </div>
      </div>

      {/* ─── 6. Pintasan Paspor Kompetensi Digital Siswa ─── */}
      <Link
        href={`/verify/${samplePassportSlug || "andi-pratama-rpl-2026"}`}
        target="_blank"
        className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/70 shadow-card hover:border-sky-300 transition-colors group"
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

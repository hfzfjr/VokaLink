"use client";

import React from "react";
import Link from "next/link";
import {
  Bell,
  Quote,
  Star,
  ShieldCheck,
  Flame,
  Clock,
  Check,
  CheckCircle2,
  Award,
  ExternalLink,
  PlusCircle,
  QrCode,
} from "lucide-react";
import type { StudentInfo } from "./types";

interface StudentWidgetPanelProps {
  student: StudentInfo;
  progressPercentage: number;
  onOpenNotifications: () => void;
  onOpenQrModal: () => void;
}

export function StudentWidgetPanel({
  student,
  progressPercentage,
  onOpenNotifications,
  onOpenQrModal,
}: StudentWidgetPanelProps) {
  return (
    <aside className="w-full lg:w-[320px] xl:w-[340px] 2xl:w-[360px] flex flex-col gap-4 flex-shrink-0">
      {/* ─── Profile Card Header (Desktop only) ─── */}
      <div className="hidden lg:flex bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-card items-center justify-between">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-semibold text-xs shadow-xs shrink-0">
            AP
          </div>
          <div className="truncate">
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight truncate">
              {student.name}
            </h2>
            <p className="text-xs text-slate-500 font-normal truncate">
              {student.email}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] tracking-wide font-mono">
                NISN: {student.nisn}
              </span>
              <span className="text-[11px] text-slate-400 font-normal truncate">· {student.dudi}</span>
            </div>
          </div>
        </div>

        {/* Bell Icon Notification Button */}
        <button
          type="button"
          onClick={onOpenNotifications}
          title="Pemberitahuan Mentor"
          className="w-9 h-9 rounded-xl bg-slate-100/80 hover:bg-slate-200/60 border border-slate-200/70 flex items-center justify-center text-slate-600 transition relative cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white" />
        </button>
      </div>

      {/* ─── Desktop 3-Box Metrics (Clean White Surface Cards) ─── */}
      <div className="hidden lg:grid grid-cols-3 gap-2.5">
        <div className="bg-white border border-slate-200/70 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-xs h-[82px] hover:border-slate-300 transition">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
            Total JP
          </span>
          <p className="text-2xl font-bold tracking-tight text-slate-900 my-1 leading-none font-mono">
            {student.verifiedJp}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium leading-none">
            ● Terdata Sah
          </span>
        </div>

        <div className="bg-white border border-slate-200/70 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-xs h-[82px] hover:border-slate-300 transition">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
            Menunggu
          </span>
          <p className="text-2xl font-bold tracking-tight text-slate-900 my-1 leading-none font-mono">
            {student.pendingJp}
          </p>
          <span className="text-[10px] text-amber-600 font-medium leading-none">
            ● Antrean PIN
          </span>
        </div>

        <div className="bg-white border border-slate-200/70 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-xs h-[82px] hover:border-slate-300 transition">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
            Capaian
          </span>
          <p className="text-2xl font-bold tracking-tight text-slate-900 my-1 leading-none font-mono">
            {progressPercentage}%
          </p>
          <span className="text-[10px] text-sky-600 font-medium leading-none">
            / 792 Target
          </span>
        </div>
      </div>

      {/* ─── Sebaran Jam Per Elemen Kompetensi SKKNI ─── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-card space-y-3.5">
        <div className="flex items-center justify-between pb-1">
          <h3 className="text-xs font-semibold text-slate-900 tracking-tight uppercase">
            Progres Capaian Pembelajaran
          </h3>
          <span className="text-[10px] font-medium text-sky-700 bg-sky-50 border border-sky-100 px-2.5 py-0.5 rounded-full font-mono">
            Fase F
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between text-[11px] font-medium mb-1">
              <span className="text-slate-800">Pemrograman Web & Mobile</span>
              <span className="text-sky-600 font-semibold font-mono">128 / 240 JP (53%)</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full" style={{ width: "53%" }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-medium mb-1">
              <span className="text-slate-800">Basis Data Relasional</span>
              <span className="text-slate-600 font-semibold font-mono">80 / 160 JP (50%)</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-slate-700 rounded-full" style={{ width: "50%" }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-medium mb-1">
              <span className="text-slate-800">Software QA & Testing</span>
              <span className="text-slate-600 font-semibold font-mono">48 / 120 JP (40%)</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-slate-500 rounded-full" style={{ width: "40%" }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-medium mb-1">
              <span className="text-slate-800">Cloud Architecture & DevOps</span>
              <span className="text-slate-600 font-semibold font-mono">32 / 120 JP (27%)</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-slate-400 rounded-full" style={{ width: "27%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Catatan Bimbingan Mentor Industri Terakhir ─── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Quote className="w-4 h-4 text-sky-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Catatan Bimbingan Mentor
            </h3>
          </div>
          <div className="flex items-center gap-1 bg-amber-50/80 border border-amber-200/60 px-2 py-0.5 rounded-full text-amber-700">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span className="text-[11px] font-semibold font-mono">4.9</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60">
          <p className="text-xs text-slate-600 leading-relaxed italic">
            &quot;Arsitektur REST API dan struktur basis data sudah sangat modular. Siswa cepat tanggap dalam sprint dan mematuhi standar clean code industri.&quot;
          </p>
        </div>

        <div className="flex items-center justify-between pt-1 text-[11px]">
          <div>
            <p className="font-semibold text-slate-900">Rizky Firmansyah</p>
            <p className="text-[10px] text-slate-500">Engineering Lead · PT Nusantara Tech</p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-medium text-[10px]">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Terverifikasi</span>
          </span>
        </div>
      </div>

      {/* ─── Presensi & Disiplin Pekan Ini ─── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-card space-y-3.5">
        <div className="flex items-center justify-between pb-0.5">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 tracking-tight uppercase">
              Presensi & Disiplin Pekan Ini
            </h3>
            <p className="text-[11px] text-slate-500 font-normal">
              Pekan ke-8 · 6–10 Oktober 2026
            </p>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50/80 border border-amber-200/70 text-amber-700 text-[10px] font-medium">
            <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>4 Pekan Streak</span>
          </div>
        </div>

        {/* 5 Workdays Progress Strip (Sen - Jum) */}
        <div className="grid grid-cols-5 gap-1.5">
          {[
            { day: "Sen", jp: 8, status: "verified", label: "Sah" },
            { day: "Sel", jp: 8, status: "verified", label: "Sah" },
            { day: "Rab", jp: 8, status: "verified", label: "Sah" },
            { day: "Kam", jp: 8, status: "verified", label: "Sah" },
            { day: "Jum", jp: 8, status: "today", label: "Hari Ini" },
          ].map((d) => {
            const isToday = d.status === "today";
            return (
              <div
                key={d.day}
                className={`flex flex-col items-center justify-between p-2 rounded-xl border transition-all text-center ${
                  isToday
                    ? "bg-sky-50/50 border-sky-500/80 ring-1 ring-sky-500/20"
                    : "bg-slate-50/70 border-slate-200/70 hover:bg-slate-100"
                }`}
              >
                <span className="text-[10px] font-medium text-slate-500 uppercase">
                  {d.day}
                </span>
                <span
                  className={`text-xs font-semibold my-0.5 font-mono ${
                    isToday ? "text-sky-600" : "text-slate-900"
                  }`}
                >
                  {d.jp} JP
                </span>
                <div className="mt-1">
                  {isToday ? (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-sky-500 text-white text-[9px] font-medium leading-none">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{d.label}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[9px] font-medium leading-none">
                      <Check className="w-2.5 h-2.5 stroke-[2.5] text-emerald-600" />
                      <span>{d.label}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Summary Metrics */}
        <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-medium uppercase block">
              Total Minggu Ini
            </span>
            <span className="font-semibold text-slate-900 text-sm font-mono">
              40 / 40 JP <span className="text-emerald-700 text-xs font-medium">(100%)</span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-medium uppercase block">
              Status Kehadiran
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nir-Anomali</span>
            </span>
          </div>
        </div>

        {/* Shortcut Paspor Keterampilan Digital (FR-009) */}
        <Link
          href="/verify/andi-pratama-rpl-2026"
          target="_blank"
          className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/70 hover:border-sky-500 shadow-2xs hover:shadow-card transition-all group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-all">
              <Award className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-900 group-hover:text-sky-600 transition truncate">
                Paspor Keterampilan Digital
              </p>
              <p className="text-[10px] text-slate-500 font-normal">
                Segel Kriptografi HMAC-SHA256 (FR-009)
              </p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-sky-600 group-hover:translate-x-0.5 transition shrink-0" />
        </Link>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <Link
          href="/student/log/new"
          className="flex items-center justify-center gap-1.5 py-3 px-3 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Catat Jurnal</span>
        </Link>

        <button
          type="button"
          onClick={onOpenQrModal}
          className="flex items-center justify-center gap-1.5 py-3 px-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <QrCode className="w-4 h-4" />
          <span>Minta Validasi</span>
        </button>
      </div>
    </aside>
  );
}

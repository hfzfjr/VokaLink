"use client";

import React from "react";
import {
  Bell,
  Quote,
  Star,
  ShieldCheck,
  Flame,
  Check,
  CheckCircle2,
} from "lucide-react";
import type { StudentInfo, KanbanTask } from "./types";

export interface WorkDayItem {
  day: string;
  jp: number;
  status: "verified" | "in_review" | "today" | "empty";
  label: string;
}

interface StudentWidgetPanelProps {
  student: StudentInfo;
  tasks?: KanbanTask[];
  todayLog?: any;
  workDays?: WorkDayItem[];
  endorsementQuote?: string;
  onOpenNotifications: () => void;
  onOpenQrModal?: () => void;
}

export function StudentWidgetPanel({
  student,
  tasks,
  todayLog,
  workDays: propWorkDays,
  endorsementQuote,
  onOpenNotifications,
  onOpenQrModal: _onOpenQrModal,
}: StudentWidgetPanelProps) {
  // Hitung dinamika 5 hari kerja pekan berjalan (Senin s/d Jumat)
  const workDays = React.useMemo(() => {
    if (propWorkDays && propWorkDays.length > 0) {
      return propWorkDays;
    }
    const defaultDays: WorkDayItem[] = [
      { day: "Sen", jp: 8, status: "verified", label: "Sah" },
      { day: "Sel", jp: 8, status: "verified", label: "Sah" },
      { day: "Rab", jp: 8, status: "verified", label: "Sah" },
      { day: "Kam", jp: 8, status: "in_review", label: "Pending" },
      { day: "Jum", jp: 8, status: "today", label: "Hari Ini" },
    ];

    if (tasks && tasks.length > 0) {
      const verifiedCount = tasks.filter((t) => t.status === "verified").length;
      if (verifiedCount >= 3 && defaultDays[2]) {
        defaultDays[2].status = "verified";
        defaultDays[2].label = "Sah";
      }
    }

    if (todayLog && defaultDays[4]) {
      defaultDays[4] = {
        day: "Jum",
        jp: todayLog.durationJp || 8,
        status: todayLog.state === "verified" ? "verified" : "in_review",
        label: todayLog.state === "verified" ? "Sah" : "Pending",
      };
    }

    return defaultDays;
  }, [propWorkDays, tasks, todayLog]);

  const weeklyVerifiedJp = React.useMemo(() => {
    return workDays
      .filter((d) => d.status === "verified")
      .reduce((acc, curr) => acc + curr.jp, 0);
  }, [workDays]);

  const weeklyPercent = Math.min(100, Math.round((weeklyVerifiedJp / 40) * 100));

  // Target kelulusan PKL (hanya dari JP terverifikasi, BR-010)
  const targetJp = student.targetJp || 1;
  const targetPercent = Math.min(100, Math.round((student.verifiedJp / targetJp) * 100));
  const verifiedWidth = Math.min(100, (student.verifiedJp / targetJp) * 100);
  const pendingWidth = Math.min(100 - verifiedWidth, (student.pendingJp / targetJp) * 100);
  const remainingJp = Math.max(0, student.targetJp - student.verifiedJp);

  const initials = (student.name || "Siswa")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="w-full lg:w-[320px] xl:w-[340px] 2xl:w-[360px] flex flex-col gap-4 flex-shrink-0">
      {/* ─── Profile Card Header (Desktop only) ─── */}
      <div className="hidden lg:flex lg:h-[86px] bg-white rounded-2xl px-4 sm:px-5 border border-slate-200/70 shadow-2xs items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-semibold text-xs shadow-xs shrink-0">
            {initials}
          </div>
          <div className="truncate min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight truncate">
              {student.name}
            </h2>
            <p className="text-xs text-slate-500 font-normal truncate mt-0.5">
              {student.email}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] tracking-wide leading-none">
                NISN: {student.nisn}
              </span>
              <span className="text-[11px] text-slate-400 font-normal truncate leading-none">· {student.dudi}</span>
            </div>
          </div>
        </div>

        {/* Bell Icon Notification Button */}
        <button
          type="button"
          onClick={onOpenNotifications}
          title="Pemberitahuan Mentor"
          className="w-9 h-9 rounded-xl bg-slate-100/80 hover:bg-slate-200/60 border border-slate-200/70 flex items-center justify-center text-slate-600 transition relative cursor-pointer shrink-0 ml-2"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white" />
        </button>
      </div>

      {/* ─── Target Kelulusan PKL (Desktop only, mobile punya kartu sendiri di beranda) ─── */}
      <div className="hidden lg:block bg-white rounded-2xl p-4 border border-slate-200/70 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase">
            Target Kelulusan PKL
          </h3>
          <span className="text-xs font-bold text-sky-600 tabular-nums">{targetPercent}%</span>
        </div>

        <div className="flex items-baseline gap-1.5 tabular-nums">
          <span className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
            {student.verifiedJp}
          </span>
          <span className="text-xs text-slate-400">/ {student.targetJp} JP sah</span>
        </div>

        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${verifiedWidth}%` }}
            className="bg-emerald-500 h-full transition-all duration-500"
          />
          <div
            style={{ width: `${pendingWidth}%` }}
            className="bg-amber-400 h-full transition-all duration-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Sah <strong className="text-slate-900 tabular-nums">{student.verifiedJp}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span>Antre <strong className="text-slate-900 tabular-nums">{student.pendingJp}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 justify-end">
            <span className="w-2 h-2 rounded-full bg-slate-200 shrink-0" />
            <span>Sisa <strong className="text-slate-900 tabular-nums">{remainingJp}</strong></span>
          </div>
        </div>
      </div>

      {/* ─── Presensi & Disiplin Pekan Ini (Desktop only, mobile has it at top of home) ─── */}
      <div className="hidden lg:block bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card space-y-3">
        <div className="flex items-center justify-between gap-2 pb-0.5">
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase whitespace-nowrap">
              Presensi &amp; Disiplin
            </h3>
            <p className="text-[11px] text-slate-500 font-normal truncate">
              Pekan Aktif · 20–24 Okt 2026
            </p>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[10.5px] font-bold shrink-0 whitespace-nowrap shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <span>4 Pekan</span>
          </div>
        </div>

        {/* 5 Workdays Progress Strip (Sen - Jum) - Mobile-Tuned */}
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
          {workDays.map((d) => {
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
                  {d.jp} <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400">JP</span>
                </span>
                <div className="mt-0.5">
                  {isToday ? (
                    <span className="inline-block px-1 sm:px-1.5 py-0.5 rounded-full bg-sky-500 text-white text-[8.5px] sm:text-[9px] font-bold leading-none whitespace-nowrap shadow-2xs">
                      Hari Ini
                    </span>
                  ) : d.status === "verified" ? (
                    <span className="inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[8.5px] sm:text-[9px] font-bold leading-none whitespace-nowrap">
                      <Check className="w-2 sm:w-2.5 h-2 sm:h-2.5 stroke-[2.5] text-emerald-600 shrink-0" />
                      <span>Sah</span>
                    </span>
                  ) : d.status === "in_review" ? (
                    <span className="inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[8.5px] sm:text-[9px] font-bold leading-none whitespace-nowrap">
                      <span>Pending</span>
                    </span>
                  ) : (
                    <span className="inline-block px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[8.5px] sm:text-[9px] font-medium leading-none">
                      -
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
              Total Minggu Ini
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight whitespace-nowrap">
                {weeklyVerifiedJp} / 40 JP
              </span>
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/80 text-[9.5px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                {weeklyPercent}%
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[9.5px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Status Kehadiran
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-emerald-700 mt-0.5 whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Nir-Anomali</span>
            </span>
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
            <span className="text-[11px] font-bold">4.9</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60">
          <p className="text-xs text-slate-600 leading-relaxed italic">
            &quot;{endorsementQuote || "Siswa menunjukkan etos kerja yang sangat baik, berdisiplin tinggi, mandiri dalam menyelesaikan tugas harian, dan patuh pada standar operasional industri."}&quot;
          </p>
        </div>

        <div className="flex items-center justify-between pt-1 text-[11px]">
          <div>
            <p className="font-semibold text-slate-900">{student.mentor || "Rizky Firmansyah"}</p>
            <p className="text-[10px] text-slate-500">Mentor Industri · {student.dudi || "PT Nusantara Tech"}</p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-medium text-[10px]">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Terverifikasi</span>
          </span>
        </div>
      </div>
    </aside>
  );
}

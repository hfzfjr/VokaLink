"use client";

import React from "react";
import Link from "next/link";
import { Clock, CheckCircle2, QrCode, PlusCircle, Inbox } from "lucide-react";
import {
  type KanbanTask,
  getCategoryBadgeStyle,
  getCategoryDotColor,
  getCategoryShortLabel,
} from "./types";

interface KanbanWorkflowBoardProps {
  tasksInProgress: KanbanTask[];
  tasksInReview: KanbanTask[];
  tasksVerified: KanbanTask[];
  totalFilteredCount: number;
  mobileColumn: "all" | "in_progress" | "in_review" | "verified";
  onSelectMobileColumn: (col: "all" | "in_progress" | "in_review" | "verified") => void;
  onSelectTask: (task: KanbanTask) => void;
  onOpenQrModal: () => void;
}

export function KanbanWorkflowBoard({
  tasksInProgress,
  tasksInReview,
  tasksVerified,
  totalFilteredCount,
  mobileColumn,
  onSelectMobileColumn,
  onSelectTask,
  onOpenQrModal,
}: KanbanWorkflowBoardProps) {
  return (
    <div>
      {/* Mobile Column Segment Switcher (Apple Segmented Control) */}
      <div className="md:hidden flex items-center gap-1 p-1 bg-slate-200/50 rounded-xl border border-slate-200/50 mb-3 text-xs font-semibold">
        <button
          type="button"
          onClick={() => onSelectMobileColumn("all")}
          className={`flex-1 py-1.5 px-1 rounded-lg text-center transition flex items-center justify-center gap-1 cursor-pointer ${
            mobileColumn === "all"
              ? "bg-white text-slate-900 shadow-xs font-semibold"
              : "text-slate-600 hover:text-slate-900 font-medium"
          }`}
        >
          <span>Semua</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200/60 text-slate-700 text-[10px] font-mono">
            {totalFilteredCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMobileColumn("in_progress")}
          className={`flex-1 py-1.5 px-1 rounded-lg text-center transition flex items-center justify-center gap-1 cursor-pointer ${
            mobileColumn === "in_progress"
              ? "bg-white text-sky-600 shadow-xs font-semibold"
              : "text-slate-600 hover:text-slate-900 font-medium"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
          <span>Aktif</span>
          <span className="px-1.5 py-0.2 rounded-full bg-sky-50 text-sky-700 text-[10px] font-mono">
            {tasksInProgress.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMobileColumn("in_review")}
          className={`flex-1 py-1.5 px-1 rounded-lg text-center transition flex items-center justify-center gap-1 cursor-pointer ${
            mobileColumn === "in_review"
              ? "bg-white text-amber-600 shadow-xs font-semibold"
              : "text-slate-600 hover:text-slate-900 font-medium"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>Validasi</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-50 border border-amber-200/70 text-amber-700 text-[10px] font-mono">
            {tasksInReview.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMobileColumn("verified")}
          className={`flex-1 py-1.5 px-1 rounded-lg text-center transition flex items-center justify-center gap-1 cursor-pointer ${
            mobileColumn === "verified"
              ? "bg-white text-emerald-600 shadow-xs font-semibold"
              : "text-slate-600 hover:text-slate-900 font-medium"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>Sah</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[10px] font-mono">
            {tasksVerified.length}
          </span>
        </button>
      </div>

      {/* 3 Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 lg:gap-4 xl:gap-5 pt-2 pb-6">
        {/* ─── Column 1: Dalam Pengerjaan (In Progress) ─── */}
        <div
          className={`${
            mobileColumn === "all" || mobileColumn === "in_progress"
              ? "flex"
              : "hidden md:flex"
          } bg-slate-50/60 rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 flex-col gap-3.5`}
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider truncate">
                Sedang Dikerjakan
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200/70 text-slate-700 text-[11px] font-medium font-mono shrink-0 shadow-2xs">
              {tasksInProgress.length}
            </span>
          </div>

          <div className="space-y-3">
            {tasksInProgress.length === 0 ? (
              <div className="py-10 px-4 rounded-xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-2 bg-white/60">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Inbox className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium text-slate-700">Tidak ada tugas aktif</p>
                <p className="text-[11px] text-slate-400 max-w-[220px]">
                  Pilih kartu pekerjaan baru dari industri untuk memulai kegiatan hari ini.
                </p>
                <Link
                  href="/student/log/new"
                  className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white text-[11px] font-medium transition shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Catat Jurnal</span>
                </Link>
              </div>
            ) : (
              tasksInProgress.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs hover:border-slate-300 hover:shadow-card transition-all duration-200 cursor-pointer space-y-3"
                  onClick={() => onSelectTask(task)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-tight ${getCategoryBadgeStyle(
                        task.categoryColor
                      )}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${getCategoryDotColor(
                          task.categoryColor
                        )}`}
                      />
                      <span>{getCategoryShortLabel(task.category)}</span>
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-medium shrink-0">
                      {task.durationJp} JP
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-[13px] font-semibold text-slate-900 leading-snug group-hover:text-sky-600 transition-colors">
                      {task.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      SKKNI: {task.skkniUnitCode}
                    </p>
                  </div>

                  {/* Progress Bar & Autonomy */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[10px] font-medium">
                      <span className="text-slate-500">{task.autonomyLabel}</span>
                      <span className="text-sky-600 font-semibold font-mono">
                        {task.progressPercent}% Selesai
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${task.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Tools Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {task.tools.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md bg-slate-100/70 text-slate-600 border border-slate-200/40 text-[9.5px] font-medium font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ─── Column 2: Menunggu Validasi Mentor (In Review) ─── */}
        <div
          className={`${
            mobileColumn === "all" || mobileColumn === "in_review"
              ? "flex"
              : "hidden md:flex"
          } bg-slate-50/60 rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 flex-col gap-3.5`}
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider truncate">
                Menunggu Validasi
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200/70 text-slate-700 text-[11px] font-medium font-mono shrink-0 shadow-2xs">
              {tasksInReview.length}
            </span>
          </div>

          <div className="space-y-3">
            {tasksInReview.length === 0 ? (
              <div className="py-10 px-4 rounded-xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-2 bg-white/60">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Clock className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium text-slate-700">Semua logbook tervalidasi</p>
                <p className="text-[11px] text-slate-400 max-w-[220px]">
                  Tidak ada antrean validasi mentor saat ini.
                </p>
              </div>
            ) : (
              tasksInReview.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs hover:border-slate-300 hover:shadow-card transition-all duration-200 cursor-pointer space-y-3"
                  onClick={() => onSelectTask(task)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-tight ${getCategoryBadgeStyle(
                        task.categoryColor
                      )}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${getCategoryDotColor(
                          task.categoryColor
                        )}`}
                      />
                      <span>{getCategoryShortLabel(task.category)}</span>
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-medium shrink-0">
                      {task.durationJp} JP
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-[13px] font-semibold text-slate-900 leading-snug group-hover:text-sky-600 transition-colors">
                      {task.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      SKKNI: {task.skkniUnitCode}
                    </p>
                  </div>

                  {/* Status Container with Calm Amber Status & Offline Indicator */}
                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between gap-2 text-[10.5px]">
                    <span className="text-slate-600 font-normal truncate flex items-center gap-1.5 min-w-0">
                      {task.isLocalDexie && (
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            task.syncState === "queued"
                              ? "bg-amber-500"
                              : "bg-sky-500 animate-pulse"
                          }`}
                          title={
                            task.syncState === "queued"
                              ? "Tersimpan di penyimpanan lokal HP"
                              : "Tersinkron ke server cloud"
                          }
                        />
                      )}
                      <span className="truncate">
                        {task.submittedAt || "Menunggu Validasi"}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/70 text-[9.5px] font-medium shrink-0">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>{task.syncState === "queued" ? "Offline" : "Pending"}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenQrModal();
                    }}
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Minta Validasi PIN</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ─── Column 3: Sah & Terverifikasi (Verified) ─── */}
        <div
          className={`${
            mobileColumn === "all" || mobileColumn === "verified"
              ? "flex"
              : "hidden md:flex"
          } bg-slate-50/60 rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 flex-col gap-3.5`}
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider truncate">
                Sah & Masuk Paspor
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200/70 text-slate-700 text-[11px] font-medium font-mono shrink-0 shadow-2xs">
              {tasksVerified.length}
            </span>
          </div>

          <div className="space-y-3">
            {tasksVerified.length === 0 ? (
              <div className="py-10 px-4 rounded-xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-2 bg-white/60">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium text-slate-700">Belum ada log terverifikasi</p>
                <p className="text-[11px] text-slate-400 max-w-[220px]">
                  Tunjukkan kode QR ke mentor Anda untuk mendapatkan segel validasi pertama.
                </p>
              </div>
            ) : (
              tasksVerified.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs hover:border-emerald-300 hover:shadow-card transition-all duration-200 cursor-pointer space-y-2.5"
                  onClick={() => onSelectTask(task)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-tight ${getCategoryBadgeStyle(
                        task.categoryColor
                      )}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${getCategoryDotColor(
                          task.categoryColor
                        )}`}
                      />
                      <span>{getCategoryShortLabel(task.category)}</span>
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-medium shrink-0">
                      {task.durationJp} JP
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-[13px] font-semibold text-slate-900 leading-snug group-hover:text-sky-600 transition-colors">
                      {task.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      SKKNI: {task.skkniUnitCode}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100/90 flex items-center justify-between gap-2 text-[10.5px]">
                    <div className="min-w-0 truncate text-slate-500 font-normal">
                      <span>Oleh </span>
                      <strong className="text-slate-800 font-semibold">
                        {task.mentorSignature || "Mentor Industri"}
                      </strong>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[9.5px] font-medium shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>HMAC Valid</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

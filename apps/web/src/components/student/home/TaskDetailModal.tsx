"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import {
  type KanbanTask,
  getCategoryBadgeStyle,
} from "./types";

interface TaskDetailModalProps {
  task: KanbanTask;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200/70 shadow-modal space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-medium shadow-2xs ${getCategoryBadgeStyle(
              task.categoryColor
            )}`}
          >
            {task.category}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail pekerjaan"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3
            id="task-detail-title"
            className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight"
          >
            {task.title}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Kode Unit SKKNI: {task.skkniUnitCode}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
              Durasi Kerja
            </span>
            <span className="font-semibold text-slate-900 font-mono">
              {task.durationJp} JP Praktik
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
              Tingkat Kemandirian
            </span>
            <span className="font-semibold text-slate-900">
              {task.autonomyLabel}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
              Tanggal Kegiatan
            </span>
            <span className="font-semibold text-slate-900">{task.date}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
              Status Validasi
            </span>
            <span className="font-semibold text-sky-600">
              {task.status === "verified"
                ? "Terverifikasi Resmi"
                : task.status === "in_review"
                ? "Menunggu PIN Mentor"
                : `${task.progressPercent}% Dikerjakan`}
            </span>
          </div>
        </div>

        {/* Tools Used */}
        <div className="space-y-1.5">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
            Tools & Teknologi
          </span>
          <div className="flex flex-wrap gap-1.5">
            {task.tools.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-md bg-slate-100/70 border border-slate-200/50 text-slate-700 text-[11px] font-medium font-mono"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Student Log Short Note if available */}
        {task.shortNote && (
          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60 text-xs space-y-1">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
              Catatan Aktivitas Siswa
            </span>
            <p className="text-slate-700 leading-relaxed font-normal">{task.shortNote}</p>
          </div>
        )}

        {/* Local Dexie PWA Indicator */}
        {task.isLocalDexie && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-50/80 border border-sky-100 text-[11px] text-sky-900 font-medium">
            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
            <span>
              Logbook tersimpan di perangkat lokal (Dexie IndexedDB)
              {task.syncState === "queued"
                ? " — menunggu jaringan online untuk sinkronisasi otomatis."
                : " — telah tersinkron ke cloud."}
            </span>
          </div>
        )}

        <div className="flex gap-2.5 pt-2">
          <Link
            href="/student/log/history"
            className="flex-1 py-2.5 px-3 text-center bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white rounded-xl text-xs font-semibold transition shadow-xs"
          >
            Buka di Riwayat Logbook
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] border border-slate-200/70 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect } from "react";
import { Bell, X } from "lucide-react";

interface MentorNotificationModalProps {
  onClose: () => void;
}

export function MentorNotificationModal({ onClose }: MentorNotificationModalProps) {
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
      aria-labelledby="mentor-notif-title"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200/70 shadow-modal space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <h3 id="mentor-notif-title" className="text-sm font-semibold text-slate-900">
              Pemberitahuan Mentor & Sekolah
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pemberitahuan"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">Jurnal Disetujui Mentor</span>
              <span className="text-[10px] text-emerald-700 font-semibold font-mono">20 Okt 2026</span>
            </div>
            <p className="text-slate-600 font-normal leading-relaxed">
              Rizky Firmansyah telah memvalidasi 8 JP untuk &quot;Implementasi REST API & Router Express&quot; dengan segel HMAC.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">Kunjungan Supervisi Guru</span>
              <span className="text-[10px] text-sky-600 font-semibold font-mono">18 Okt 2026</span>
            </div>
            <p className="text-slate-600 font-normal leading-relaxed">
              Guru Dra. Siti Rahayu telah mencatat koordinasi bimbingan lapangan dengan mentor industri Anda.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
}

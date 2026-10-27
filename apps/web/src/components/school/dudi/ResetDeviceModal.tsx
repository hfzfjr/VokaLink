"use client";

import React from "react";
import { RotateCcw } from "lucide-react";

interface ResetDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorName: string;
  onConfirmReset: () => Promise<void>;
  resetting: boolean;
}

export function ResetDeviceModal({
  isOpen,
  onClose,
  mentorName,
  onConfirmReset,
  resetting,
}: ResetDeviceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
            <RotateCcw className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Reset Ikatan Perangkat HP {mentorName}?
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tindakan ini akan memutus ikatan cookie/device token mentor pada HP lama (misal: mentor ganti HP atau HP hilang). Mentor harus mengaktivasi ulang HP baru sebelum dapat menyetujui logbook siswa kembali (BR-007).
            </p>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={resetting}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirmReset}
            disabled={resetting}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{resetting ? "Mereset..." : "Reset Ikatan Perangkat"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Lock } from "lucide-react";
import { TOTAL_TARGET_JP } from "@vokalink/shared";

interface LockCurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentName: string;
  onConfirmLock: () => Promise<void>;
  locking: boolean;
}

export function LockCurriculumModal({
  isOpen,
  onClose,
  departmentName,
  onConfirmLock,
  locking,
}: LockCurriculumModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Kunci Matriks Kurikulum {departmentName}?
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Sesuai aturan bisnis <span className="font-bold text-slate-700">BR-002</span>, penguncian kurikulum memastikan total alokasi genap <span className="font-bold text-sky-600">{TOTAL_TARGET_JP} JP</span>. Setelah dikunci, bobot JP per elemen tidak dapat diubah kembali demi menjaga integritas data logbook siswa dan e-Rapor.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Dampak Penguncian:</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-500">
              <li>Siswa jurusan ini dapat langsung memilih kartu kerja di logbook.</li>
              <li>Perhitungan drift kurikulum (FR-008) otomatis diaktifkan.</li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={locking}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirmLock}
            disabled={locking}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span>{locking ? "Mengunci..." : "Kunci Permanen Sekarang"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

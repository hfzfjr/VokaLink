"use client";

import React, { useState } from "react";
import { X, Sparkles, Check } from "lucide-react";
import type { PlacementCandidateData } from "@/lib/api";

interface BatchMatchItem {
  studentId: string;
  studentName: string;
  departmentName: string;
  dudiId: string;
  dudiName: string;
  totalScore: number;
  distanceKm: number;
}

interface BatchGreedyModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: BatchMatchItem[];
  defaultTeacherId: string;
  teachers: PlacementCandidateData["teachers"];
  onConfirmBatch: (placements: Array<{ studentId: string; dudiId: string; teacherId: string }>) => Promise<void>;
  submitting: boolean;
}

export function BatchGreedyModal({
  isOpen,
  onClose,
  matches,
  defaultTeacherId,
  teachers,
  onConfirmBatch,
  submitting,
}: BatchGreedyModalProps) {
  const [chosenTeacherId, setChosenTeacherId] = useState<string>(defaultTeacherId);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    const payload = matches.map((m) => ({
      studentId: m.studentId,
      dudiId: m.dudiId,
      teacherId: chosenTeacherId,
    }));
    await onConfirmBatch(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pratinjau Auto-Greedy Placement ({matches.length} Siswa)
              </h3>
              <p className="text-[11px] text-slate-500">
                Optimasi global kuota mitra industri & kesesuaian kurikulum 70/30
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {matches.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Tidak ada siswa yang dapat dicocokkan dengan kuota mitra saat ini.
            </div>
          ) : (
            <>
              {/* Guru Pembimbing Terpilih */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Pilih Guru Pembimbing untuk Batch Penempatan Ini:
                </label>
                <select
                  value={chosenTeacherId}
                  onChange={(e) => setChosenTeacherId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} (NIP: {t.identityNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Matched Students List */}
              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Daftar Pasangan Hasil Algoritma
                </p>
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-slate-50/50 overflow-hidden">
                  {matches.map((item) => (
                    <div
                      key={item.studentId}
                      className="p-3 flex items-center justify-between text-xs gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{item.studentName}</p>
                        <p className="text-[10.5px] text-slate-400">{item.departmentName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sky-600 truncate">{item.dudiName}</p>
                        <p className="text-[10px] text-slate-400">
                          Skor {Math.round(item.totalScore)} &bull; {item.distanceKm} km
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || matches.length === 0 || !chosenTeacherId}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5 text-sky-400" />
            <span>{submitting ? "Mengeksekusi..." : `Terapkan Penempatan (${matches.length} Siswa)`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

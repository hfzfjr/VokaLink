"use client";

import React, { useState } from "react";
import { X, UserCheck, AlertCircle, Check } from "lucide-react";
import type { PlacementCandidateStudent, PlacementCandidateData } from "@/lib/api";

interface SingleAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: PlacementCandidateStudent | null;
  dudis: PlacementCandidateData["dudis"];
  teachers: PlacementCandidateData["teachers"];
  onSubmit: (payload: {
    studentId: string;
    dudiId: string;
    teacherId: string;
    overrideReason?: string;
  }) => Promise<void>;
}

export function SingleAssignModal({
  isOpen,
  onClose,
  student,
  dudis,
  teachers,
  onSubmit,
}: SingleAssignModalProps) {
  const [chosenDudiId, setChosenDudiId] = useState<string>(
    student?.bestRecommendation?.dudiId || dudis[0]?.id || ""
  );
  const [chosenTeacherId, setChosenTeacherId] = useState<string>(teachers[0]?.id || "");
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const isOverride =
    student.bestRecommendation &&
    chosenDudiId !== student.bestRecommendation.dudiId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenDudiId || !chosenTeacherId) {
      setError("Silakan pilih mitra industri dan guru pembimbing.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        studentId: student.studentId,
        dudiId: chosenDudiId,
        teacherId: chosenTeacherId,
        overrideReason: isOverride ? overrideReason.trim() : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan penempatan siswa.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Plotkan Penempatan Siswa</h3>
              <p className="text-[11px] text-slate-500 truncate max-w-xs">{student.fullName}</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-900">{student.fullName}</p>
              <p className="text-[11px] text-slate-500 font-mono">NISN: {student.identityNumber}</p>
            </div>
            {student.department && (
              <span className="px-2 py-0.5 rounded-md bg-white text-slate-700 font-bold border border-slate-200 text-[10px]">
                {student.department.name}
              </span>
            )}
          </div>

          {/* Pilih Mitra DUDI */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Pilih Mitra Industri (DUDI) *
            </label>
            <select
              value={chosenDudiId}
              onChange={(e) => setChosenDudiId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
            >
              {dudis.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.city}) — Sisa Kuota: {d.remainingQuota}
                </option>
              ))}
            </select>
          </div>

          {/* Override Alert If Different from Best Recommendation */}
          {isOverride && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2 text-xs">
              <p className="font-bold text-amber-800">
                Peringatan: Pilihan berbeda dari rekomendasi terbaik algoritma ({student.bestRecommendation?.dudiName}).
              </p>
              <div>
                <label className="text-[11px] font-semibold text-amber-900 block mb-1">
                  Alasan Justifikasi Manual (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Permintaan khusus dari industri / orang tua siswa"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>
          )}

          {/* Pilih Guru Pembimbing */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Guru Pembimbing Sekolah *
            </label>
            <select
              value={chosenTeacherId}
              onChange={(e) => setChosenTeacherId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} (NIP: {t.identityNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold hover:bg-sky-600 transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? "Menyimpan..." : "Simpan Penempatan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

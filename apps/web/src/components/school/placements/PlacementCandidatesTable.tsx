"use client";

import React from "react";
import {
  MapPin,
  Sparkles,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import type { PlacementCandidateStudent } from "@/lib/api";

interface PlacementCandidatesTableProps {
  students: PlacementCandidateStudent[];
  onOpenAssignModal: (student: PlacementCandidateStudent) => void;
  onOpenCoordModal: (student: PlacementCandidateStudent) => void;
}

export function PlacementCandidatesTable({
  students,
  onOpenAssignModal,
  onOpenCoordModal,
}: PlacementCandidatesTableProps) {
  if (students.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
        <p className="text-sm font-bold text-slate-800">Semua Siswa Telah Ditempatkan</p>
        <p className="text-xs text-slate-400">
          Tidak ada siswa yang menunggu penempatan pada kriteria filter saat ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {students.map((student) => {
        const bestRec = student.bestRecommendation;

        return (
          <div
            key={student.studentId}
            className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition"
          >
            {/* Student Info & Coordinates */}
            <div className="space-y-1.5 min-w-0 max-w-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-900 truncate">
                  {student.fullName}
                </span>
                {student.department && (
                  <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-extrabold text-[10px] border border-sky-100 shrink-0">
                    {student.department.name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-mono text-slate-600 font-medium">
                  NISN: {student.identityNumber}
                </span>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => onOpenCoordModal(student)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-sky-600 transition cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                  <span>
                    {student.hasCustomCoordinates
                      ? `${student.homeLatitude.toFixed(3)}, ${student.homeLongitude.toFixed(3)}`
                      : "Koordinat Default (Ubah)"}
                  </span>
                </button>
              </div>
            </div>

            {/* Rekomendasi Algoritma 70/30 */}
            <div className="flex-1 min-w-0 md:px-4">
              {bestRec ? (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {bestRec.dudiName}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-xs border border-emerald-200 shrink-0 tabular-nums">
                      Skor {Math.round(bestRec.totalScore)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                    <span>
                      CP Relevan (70%):{" "}
                      <strong className="text-slate-700">
                        {Math.round(bestRec.competencyScore)}%
                      </strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Jarak (30%):{" "}
                      <strong className="text-slate-700">{bestRec.distanceKm} km</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Sisa Kuota:{" "}
                      <strong className="text-slate-700">{bestRec.remainingQuota}</strong>
                    </span>
                  </div>

                  {bestRec.requiresMidtermRotation && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 pt-0.5">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>Kesesuaian CP &lt; 60% — Direkomendasikan rotasi tengah semester</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Tidak ada kuota mitra yang cocok atau memenuhi kriteria.
                </p>
              )}
            </div>

            {/* Action: Single Assign Modal */}
            <div className="shrink-0 flex items-center justify-end">
              <button
                type="button"
                onClick={() => onOpenAssignModal(student)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Plotkan Siswa</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

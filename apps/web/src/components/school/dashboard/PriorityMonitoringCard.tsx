"use client";

import React from "react";
import Link from "next/link";
import { Clock, AlertCircle, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { TOTAL_TARGET_JP } from "@vokalink/shared";

export interface PriorityStudentItem {
  id: string;
  name: string;
  department: string;
  dudiName: string;
  jpProgress: number;
  pendingLogs: number;
  statusText: string;
  severity: "warning" | "info" | "success";
}

interface PriorityMonitoringCardProps {
  students: PriorityStudentItem[];
}

export function PriorityMonitoringCard({ students }: PriorityMonitoringCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-500" />
            Prioritas Pemantauan Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Siswa yang memerlukan perhatian guru pembimbing atau verifikasi mentor.
          </p>
        </div>
        <Link
          href="/school/erapor"
          className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 transition self-start sm:self-auto"
        >
          <span>Semua Rekap Siswa</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {students.map((student) => (
          <div
            key={student.id}
            className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between gap-3 hover:border-slate-300 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="font-bold text-sm text-slate-900 block truncate">
                  {student.name}
                </span>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {student.dudiName}
                </p>
                <div className="mt-1">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold text-[10px] border border-sky-100 truncate max-w-full">
                    {student.department}
                  </span>
                </div>
              </div>

              {student.severity === "warning" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 shrink-0">
                  <AlertCircle className="w-3 h-3 text-amber-600" /> Perlu Review
                </span>
              ) : student.severity === "info" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-200 shrink-0">
                  <Sparkles className="w-3 h-3 text-sky-500" /> Info
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> On-Track
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
              <span className="text-slate-600 text-[11px] font-medium">{student.statusText}</span>
              <span className="font-bold text-slate-900 shrink-0 tabular-nums">
                {student.jpProgress} / {TOTAL_TARGET_JP} JP
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

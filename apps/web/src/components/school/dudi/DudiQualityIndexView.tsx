"use client";

import React from "react";
import { Award, TrendingUp, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import type { DudiQualityAuditResponse } from "@/lib/api";

interface DudiQualityIndexViewProps {
  data: DudiQualityAuditResponse | null;
  loading: boolean;
}

export function DudiQualityIndexView({ data, loading }: DudiQualityIndexViewProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 rounded-3xl bg-slate-200 animate-pulse" />
        <div className="h-64 rounded-3xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!data || !data.partners || data.partners.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
        <Award className="w-10 h-10 text-slate-300 mx-auto" />
        <p className="text-sm font-bold text-slate-700">Data Audit Quality Index Belum Tersedia</p>
        <p className="text-xs text-slate-400">
          Audit kepatuhan akan terakumulasi otomatis saat siswa dan mentor melakukan verifikasi logbook.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              Peringkat DUDI Quality Index Score (QIS)
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold text-xs">
              FR-010 Terverifikasi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluasi objektif kemitraan industri berdasarkan kecepatan respon mentor dan penyelarasan kurikulum.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-right shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Rerata Indeks Kemitraan
          </span>
          <span className="text-lg font-black text-slate-900 tabular-nums">
            {data.summary?.avgQualityScore ? data.summary.avgQualityScore.toFixed(1) : 0} / 100
          </span>
        </div>
      </div>

      {/* Quality Index Ranking Cards */}
      <div className="space-y-3">
        {data.partners.map((item, index) => {
          const isTopTier = item.overallQualityScore >= 80;
          const isMidTier = item.overallQualityScore >= 65 && item.overallQualityScore < 80;

          return (
            <div
              key={item.dudiId}
              className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                    index === 0
                      ? "bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs"
                      : index === 1
                      ? "bg-slate-200 text-slate-800"
                      : index === 2
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  #{index + 1}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {item.dudiName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                      {item.sectorCategory}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Rerata Validasi: {item.avgValidationDays} hari
                    </span>
                    <span>&bull;</span>
                    <span className="font-medium">
                      Total Jam: {item.totalJp} JP ({item.competencyJp} JP Relevan)
                    </span>
                  </div>
                </div>
              </div>

              {/* Score Badges */}
              <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-0 border-slate-100 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Quality Index
                  </span>
                  <span className="text-base font-black text-slate-900 tabular-nums">
                    {item.overallQualityScore.toFixed(1)}
                  </span>
                </div>

                {isTopTier ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mitra Unggul
                  </span>
                ) : isMidTier ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-50 text-sky-700 font-extrabold text-xs border border-sky-200">
                    <TrendingUp className="w-3.5 h-3.5" /> Standar Baik
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-extrabold text-xs border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5" /> Perlu Review
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

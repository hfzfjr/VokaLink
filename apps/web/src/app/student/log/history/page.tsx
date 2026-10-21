"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  QrCode,
  Share2,
  FileText,
  Filter,
} from "lucide-react";

export default function LogHistoryPage() {
  const [filter, setFilter] = useState<"ALL" | "VERIFIED" | "PENDING">("ALL");

  const sampleLogs = [
    {
      id: "log-1",
      date: "2026-10-20",
      title: "Implementasi REST API & Router Express",
      durationJp: 8,
      autonomy: "Mandiri",
      status: "VERIFIED",
      verifiedAt: "20 Okt 2026, 17:30 WIB",
      mentor: "Rizky Firmansyah",
      hasPhoto: true,
    },
    {
      id: "log-2",
      date: "2026-10-19",
      title: "Refactoring Skema Database & Migration",
      durationJp: 8,
      autonomy: "Terbimbing",
      status: "PENDING_VERIFICATION",
      verifiedAt: null,
      mentor: "Rizky Firmansyah",
      hasPhoto: true,
    },
    {
      id: "log-3",
      date: "2026-10-18",
      title: "Bantuan Operasional Umum (Non-Jurusan)",
      durationJp: 4,
      autonomy: "Mandiri",
      status: "VERIFIED",
      verifiedAt: "18 Okt 2026, 18:00 WIB",
      mentor: "Rizky Firmansyah",
      hasPhoto: false,
      isNonCompetency: true,
    },
  ];

  const filteredLogs = sampleLogs.filter((log) => {
    if (filter === "VERIFIED") return log.status === "VERIFIED";
    if (filter === "PENDING") return log.status === "PENDING_VERIFICATION";
    return true;
  });

  return (
    <div className="space-y-4 py-1">
      {/* Header & Verification Quick Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Riwayat Logbook
          </h2>
          <p className="text-xs text-slate-500">
            Daftar kegiatan harian PKL yang telah dicatat
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            alert("Membuat Dynamic QR / Tautan WA verifikasi untuk log pending!")
          }
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
        >
          <QrCode className="w-3.5 h-3.5" />
          Minta Verifikasi
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-bold text-slate-600">
        {[
          { id: "ALL" as const, label: "Semua" },
          { id: "PENDING" as const, label: "Menunggu" },
          { id: "VERIFIED" as const, label: "Terverifikasi" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`flex-1 py-1.5 rounded-lg text-center transition ${
              filter === tab.id
                ? "bg-white text-slate-900 shadow-xs"
                : "hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Log Items List */}
      <div className="space-y-2.5">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {log.date}
                </span>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {log.title}
                </h4>
              </div>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap ${
                  log.status === "VERIFIED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {log.status === "VERIFIED" ? "TERVERIFIKASI" : "MENUNGGU"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
              <span>
                Durasi: <strong className="text-slate-800">{log.durationJp} JP</strong> · {log.autonomy}
              </span>
              {log.isNonCompetency && (
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                  Non-Jurusan
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

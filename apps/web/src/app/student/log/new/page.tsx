"use client";

import React, { useState } from "react";
import {
  Calendar,
  Layers,
  Sparkles,
  Camera,
  AlertCircle,
  ShieldCheck,
  Check,
} from "lucide-react";
import {
  MIN_DAILY_JP,
  MAX_DAILY_JP,
  MAX_BACKDATE_DAYS,
  NON_COMPETENCY_JOB_CARD_TITLE,
} from "@vokalink/shared";

export default function NewLogPage() {
  // Date helper (H to H-3)
  const today = new Date().toISOString().split("T")[0]!;
  const [selectedDate, setSelectedDate] = useState(today);
  const [isNonCompetency, setIsNonCompetency] = useState(false);
  const [nonCompetencyCategory, setNonCompetencyCategory] = useState("ADMIN_UMUM");
  const [durationJp, setDurationJp] = useState(8);
  const [autonomyLevel, setAutonomyLevel] = useState<1 | 2 | 3>(3);
  const [shortNote, setShortNote] = useState("");

  // Demo RPL Job Cards
  const sampleJobCards = [
    {
      id: "jc-1",
      title: "Implementasi REST API & Router Express",
      tools: ["Express", "TypeScript"],
      skkni: "J.620100.009.01",
    },
    {
      id: "jc-2",
      title: "Desain Skema Database & Migrasi Prisma",
      tools: ["PostgreSQL", "Prisma ORM"],
      skkni: "J.620100.010.01",
    },
    {
      id: "jc-3",
      title: "Pembuatan Komponen UI Frontend Mobile-First",
      tools: ["Next.js", "Tailwind CSS"],
      skkni: "J.620100.012.01",
    },
  ];

  const [selectedJobCardId, setSelectedJobCardId] = useState(sampleJobCards[0]!.id);

  return (
    <div className="space-y-4 py-1">
      {/* Page Title */}
      <div>
        <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
          Catat Jurnal Harian
        </h2>
        <p className="text-xs text-slate-500">
          Pilih kartu tugas sesuai pekerjaan yang Anda kerjakan hari ini
        </p>
      </div>

      {/* 1. Date Selector (BR-003: H to H-3) */}
      <section className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
        <label
          htmlFor="log-date"
          className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
        >
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          Tanggal Kegiatan (Maksimal H-3)
        </label>
        <input
          id="log-date"
          type="date"
          value={selectedDate}
          max={today}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <p className="text-[10px] text-slate-400">
          Aturan BR-003: Jurnal hanya dapat diisi untuk hari berjalan hingga 3 hari ke belakang.
        </p>
      </section>

      {/* 2. Tombol Jujur (BR-004: Non-Competency Whistleblower) */}
      <section className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 shadow-2xs space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <span className="p-1 rounded-md bg-amber-500 text-white mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                Tombol Jujur (Tugas Non-Jurusan)
              </h4>
              <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                Ditugaskan pekerjaan di luar keahlian RPL? Laporkan secara aman di sini.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsNonCompetency(!isNonCompetency)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${
              isNonCompetency ? "bg-amber-600" : "bg-slate-300"
            }`}
            aria-pressed={isNonCompetency}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                isNonCompetency ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {isNonCompetency && (
          <div className="pt-2 border-t border-amber-200/60 space-y-2 animate-in fade-in duration-200">
            <label className="text-[11px] font-bold text-amber-900">
              Kategori Pekerjaan Umum:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: "ADMIN_UMUM", label: "Administrasi Umum" },
                { id: "KEBERSIHAN_GUDANG", label: "Kebersihan / Gudang" },
                { id: "KURIR", label: "Kurir / Pengantaran" },
                { id: "JAGA_TOKO", label: "Jaga Toko / Resepsionis" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setNonCompetencyCategory(cat.id)}
                  className={`p-2 rounded-xl text-left font-medium transition ${
                    nonCompetencyCategory === cat.id
                      ? "bg-amber-600 text-white font-bold"
                      : "bg-white text-slate-700 border border-amber-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-amber-800 leading-snug">
              💡 <strong>Jam kehadiran Anda tetap dihitung penuh</strong>, namun guru pembimbing
              akan mendapatkan sinyal otomatis untuk pendampingan.
            </p>
          </div>
        )}
      </section>

      {/* 3. Job Card Selection (If competency) */}
      {!isNonCompetency && (
        <section className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 px-1">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Pilih Kartu Pekerjaan (Job Card)
          </label>
          <div className="space-y-2">
            {sampleJobCards.map((card) => {
              const isSelected = selectedJobCardId === card.id;
              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedJobCardId(card.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition active:scale-[0.99] ${
                    isSelected
                      ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                        {card.skkni}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {card.title}
                      </h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {card.tools.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "border-2 border-slate-300"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Durasi JP Slider (BR-002: 1 to 12 JP) */}
      <section className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700">
            Durasi Waktu Praktik:
          </label>
          <span className="text-sm font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
            {durationJp} Jam Pelajaran (JP)
          </span>
        </div>
        <input
          type="range"
          min={MIN_DAILY_JP}
          max={MAX_DAILY_JP}
          value={durationJp}
          onChange={(e) => setDurationJp(parseInt(e.target.value, 10))}
          className="w-full accent-blue-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
          <span>{MIN_DAILY_JP} JP</span>
          <span>Standar: 8–10 JP/hari</span>
          <span>{MAX_DAILY_JP} JP</span>
        </div>
      </section>

      {/* 5. Autonomy Level (BR-009) */}
      <section className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
        <label className="text-xs font-bold text-slate-700">
          Tingkat Kemandirian Pengerjaan:
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { level: 1 as const, label: "Observasi", desc: "Melihat / Membantu" },
            { level: 2 as const, label: "Terbimbing", desc: "Didampingi Mentor" },
            { level: 3 as const, label: "Mandiri", desc: "Bekerja Sendiri" },
          ].map((item) => (
            <button
              key={item.level}
              type="button"
              onClick={() => setAutonomyLevel(item.level)}
              className={`p-2 rounded-xl text-center flex flex-col items-center justify-center transition ${
                autonomyLevel === item.level
                  ? "bg-blue-600 text-white font-bold shadow-xs ring-2 ring-blue-600/30"
                  : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className="text-xs font-bold">{item.label}</span>
              <span
                className={`text-[9px] mt-0.5 ${
                  autonomyLevel === item.level ? "text-blue-100" : "text-slate-400"
                }`}
              >
                {item.desc}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 6. Catatan Singkat */}
      <section className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
        <label htmlFor="short-note" className="text-xs font-bold text-slate-700">
          Catatan Tambahan (Opsional):
        </label>
        <textarea
          id="short-note"
          value={shortNote}
          onChange={(e) => setShortNote(e.target.value)}
          maxLength={250}
          rows={2}
          placeholder="Ringkasan kendala atau output spesifik yang diselesaikan..."
          className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <div className="text-right text-[10px] text-slate-400">
          {shortNote.length}/250 karakter
        </div>
      </section>

      {/* Submit Button */}
      <button
        type="button"
        onClick={() => {
          alert("Logbook disimpan secara lokal (IndexedDB) dan siap disinkronkan!");
        }}
        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md hover:from-blue-700 hover:to-indigo-700 transition active:scale-[0.99] flex items-center justify-center gap-2"
      >
        <ShieldCheck className="w-4 h-4" />
        Simpan Jurnal Harian
      </button>
    </div>
  );
}

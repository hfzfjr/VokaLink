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
  Clock,
  Info,
} from "lucide-react";
import {
  MIN_DAILY_JP,
  MAX_DAILY_JP,
  MAX_BACKDATE_DAYS,
  NON_COMPETENCY_JOB_CARD_TITLE,
} from "@vokalink/shared";

export default function NewLogPage() {
  const today = new Date().toISOString().split("T")[0]!;
  const [selectedDate, setSelectedDate] = useState(today);
  const [isNonCompetency, setIsNonCompetency] = useState(false);
  const [nonCompetencyCategory, setNonCompetencyCategory] = useState("ADMIN_UMUM");
  const [durationJp, setDurationJp] = useState(8);
  const [autonomyLevel, setAutonomyLevel] = useState<1 | 2 | 3>(3);
  const [shortNote, setShortNote] = useState("");

  const sampleJobCards = [
    {
      id: "jc-1",
      title: "Implementasi REST API & Router Express",
      tools: ["Express", "TypeScript"],
      skkni: "J.620100.009.01",
      category: "Backend Development",
    },
    {
      id: "jc-2",
      title: "Desain Skema Database & Migrasi Prisma",
      tools: ["PostgreSQL", "Prisma ORM"],
      skkni: "J.620100.010.01",
      category: "Database & Storage",
    },
    {
      id: "jc-3",
      title: "Pembuatan Komponen UI Frontend Mobile-First",
      tools: ["Next.js", "Tailwind CSS"],
      skkni: "J.620100.012.01",
      category: "Frontend UI/UX",
    },
    {
      id: "jc-4",
      title: "Pengujian Unit Testing & Integrasi API",
      tools: ["Vitest", "Supertest"],
      skkni: "J.620100.015.01",
      category: "Quality Assurance",
    },
  ];

  const [selectedJobCardId, setSelectedJobCardId] = useState(sampleJobCards[0]!.id);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Catat Jurnal Harian PKL
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Pilih kartu tugas yang telah Anda selesaikan hari ini tanpa perlu mengetik paragraf panjang
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5" />
          <span>Alokasi: {durationJp} JP Terpilih</span>
        </div>
      </div>

      {/* Main Form Grid (2 Columns on Desktop) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          alert("Logbook harian berhasil disimpan ke antrean lokal (IndexedDB)!");
        }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* LEFT COLUMN: Date & Job Cards Selection (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Date Selector (BR-003: H to H-3) */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="log-date"
                className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                Tanggal Pelaksanaan Kegiatan
              </label>
              <span className="text-[11px] font-semibold text-slate-400">
                Maksimal H-3 (BR-003)
              </span>
            </div>
            <input
              id="log-date"
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-sm font-semibold px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 leading-snug">
              <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              Sistem membatasi backdate hingga 3 hari kalender ke belakang untuk mencegah pengisian rapelan fiktif di akhir bulan.
            </p>
          </section>

          {/* 2. Job Card Selection (If competency) */}
          {!isNonCompetency ? (
            <section className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Pilih Kartu Pekerjaan (Job Cards Mitra)
                </label>
                <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                  {sampleJobCards.length} Kartu Aktif
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {sampleJobCards.map((card) => {
                  const isSelected = selectedJobCardId === card.id;
                  return (
                    <div
                      key={card.id}
                      onClick={() => setSelectedJobCardId(card.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition active:scale-[0.99] flex flex-col justify-between ${
                        isSelected
                          ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                            {card.skkni}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : "border-2 border-slate-300"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                          {card.title}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-slate-100">
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
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="bg-amber-50 p-5 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Pelaporan Tugas Non-Kejuruan (Bantuan Operasional Umum)</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Anda memilih kartu non-jurusan. Jam kehadiran ini tetap dihitung penuh memenuhi kewajiban PKL Anda (BR-004), namun tidak akan menambah jam teknis pada CV ATS Anda.
              </p>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: Tombol Jujur, Slider, Autonomy, Submit (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 3. Tombol Jujur (BR-004: Non-Competency Whistleblower) */}
          <section className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200/80 shadow-2xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="p-1.5 rounded-lg bg-amber-500 text-white mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Tombol Jujur (Tugas Non-Jurusan)
                  </h3>
                  <p className="text-xs text-slate-600 leading-snug mt-0.5">
                    Ditugaskan pekerjaan di luar keahlian RPL? Laporkan secara aman di sini.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNonCompetency(!isNonCompetency)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none flex-shrink-0 ${
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
              <div className="pt-3 border-t border-amber-200/60 space-y-2.5 animate-in fade-in duration-200">
                <label className="text-xs font-bold text-amber-900">
                  Kategori Pekerjaan yang Diberikan:
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
                      className={`p-2.5 rounded-xl text-left font-medium transition ${
                        nonCompetencyCategory === cat.id
                          ? "bg-amber-600 text-white font-bold shadow-xs"
                          : "bg-white text-slate-700 border border-amber-200 hover:bg-amber-100/50"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 4. Durasi JP Slider (BR-002: 1 to 12 JP) */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-slate-800">
                Durasi Waktu Praktik Harian:
              </label>
              <span className="text-sm font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                {durationJp} Jam Pelajaran (JP)
              </span>
            </div>
            <input
              type="range"
              min={MIN_DAILY_JP}
              max={MAX_DAILY_JP}
              value={durationJp}
              onChange={(e) => setDurationJp(parseInt(e.target.value, 10))}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
              <span>Min: {MIN_DAILY_JP} JP</span>
              <span className="text-slate-600 font-bold">Rekomendasi: 8–10 JP</span>
              <span>Max: {MAX_DAILY_JP} JP (BR-002)</span>
            </div>
          </section>

          {/* 5. Autonomy Level (BR-009) */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <label className="text-xs sm:text-sm font-bold text-slate-800">
              Tingkat Kemandirian Pengerjaan Tugas:
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { level: 1 as const, label: "Observasi", score: "Bobot 75", desc: "Melihat / Membantu" },
                { level: 2 as const, label: "Terbimbing", score: "Bobot 88", desc: "Didampingi Mentor" },
                { level: 3 as const, label: "Mandiri", score: "Bobot 100", desc: "Mengerjakan Sendiri" },
              ].map((item) => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setAutonomyLevel(item.level)}
                  className={`p-3 rounded-2xl text-center flex flex-col items-center justify-center transition ${
                    autonomyLevel === item.level
                      ? "bg-blue-600 text-white font-bold shadow-md ring-2 ring-blue-600/30"
                      : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-xs sm:text-sm font-bold">{item.label}</span>
                  <span
                    className={`text-[10px] font-semibold mt-0.5 ${
                      autonomyLevel === item.level ? "text-blue-100" : "text-blue-600"
                    }`}
                  >
                    {item.score}
                  </span>
                  <span
                    className={`text-[9px] mt-1 line-clamp-1 ${
                      autonomyLevel === item.level ? "text-blue-200" : "text-slate-400"
                    }`}
                  >
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* 6. Catatan Singkat */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="short-note" className="text-xs sm:text-sm font-bold text-slate-800">
                Catatan Singkat (Opsional):
              </label>
              <span className="text-[11px] text-slate-400">
                {shortNote.length}/250
              </span>
            </div>
            <textarea
              id="short-note"
              value={shortNote}
              onChange={(e) => setShortNote(e.target.value)}
              maxLength={250}
              rows={2}
              placeholder="Tuliskan ringkasan kendala atau fitur spesifik yang Anda selesaikan..."
              className="w-full text-xs sm:text-sm p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </section>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-sm sm:text-base shadow-md hover:from-blue-700 hover:to-indigo-700 transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5" />
            Simpan Jurnal Harian Sekarang
          </button>
        </div>
      </form>
    </div>
  );
}

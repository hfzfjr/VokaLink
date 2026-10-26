"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Clock,
  Briefcase,
  AlertTriangle,
  Check,
  ChevronDown,
  Minus,
  Plus,
  Sparkles,
  Info,
  RotateCcw,
} from "lucide-react";
import { convertRealHoursToJp } from "@vokalink/shared";
import { cn } from "@/lib/cn";

export const OVERTIME_JUSTIFICATIONS = [
  { id: "Rilis / Deployment Sistem", label: "Rilis / Deployment Sistem", desc: "Membantu rilis aplikasi ke server live" },
  { id: "Deadline Proyek Klien", label: "Deadline Proyek Klien", desc: "Penyelesaian milestone mendesak klien" },
  { id: "Perbaikan Server Mendesak", label: "Perbaikan Server Mendesak", desc: "Troubleshooting insiden teknis di luar jam normal" },
  { id: "Inventaris & Stock Opname", label: "Inventaris & Stock Opname", desc: "Penghitungan berkala aset & logistik DUDI" },
];

interface SmartShiftSelectorProps {
  durationJp: number;
  onChangeDuration: (duration: number) => void;
  overtimeReason?: string;
  onChangeOvertimeReason?: (reason: string) => void;
  minJp?: number;
  maxJp?: number;
  isSaturday?: boolean;
  isWeekday?: boolean;
  existingDailyJp?: number;
  remainingDailyQuota?: number;
  onResetTodayLogs?: () => void;
  className?: string;
}

interface ShiftOption {
  hours: number;
  title: string;
  subtitle: string;
  badge: string;
  isStandard?: boolean;
  isOvertime?: boolean;
}

export function SmartShiftSelector({
  durationJp,
  onChangeDuration,
  overtimeReason = "",
  onChangeOvertimeReason,
  minJp = 1,
  maxJp = 12,
  isSaturday = false,
  isWeekday: _isWeekday = true,
  existingDailyJp = 0,
  remainingDailyQuota = 12,
  onResetTodayLogs,
  className,
}: SmartShiftSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Daftar 4 shift industri baku yang bersih dan relevan
  const shiftOptions: ShiftOption[] = useMemo(() => {
    return [
      {
        hours: 8,
        title: "Full Day (5 Hari Kerja)",
        subtitle: "Standar Baku DUDI Kurikulum Merdeka",
        badge: "Standar Baku ⭐",
        isStandard: true,
      },
      {
        hours: 7,
        title: "Full Day (6 Hari Kerja)",
        subtitle: "Skema industri Senin sampai Sabtu",
        badge: "Shift 6 Hari",
      },
      {
        hours: isSaturday ? 5 : 6,
        title: isSaturday ? "Shift Khusus Sabtu" : "Shift Pagi / Sore",
        subtitle: isSaturday ? "Jam penyesuaian akhir pekan" : "Shift rotasi operasional",
        badge: isSaturday ? "Sabtu (5 Jam)" : "Rotasi (6 Jam)",
      },
      {
        hours: 4,
        title: "Setengah Hari Kerja",
        subtitle: "Sesi minimal praktik industri",
        badge: "Setengah Hari",
      },
      {
        hours: 9,
        title: "Proyek Khusus / Lembur",
        subtitle: "Jam tambahan dengan pengawasan K3",
        badge: "Lembur (+1 Jam)",
        isOvertime: true,
      },
    ];
  }, [isSaturday]);

  // Konversi JP dinamis
  const equivalentJp = useMemo(
    () => convertRealHoursToJp(durationJp).toFixed(1),
    [durationJp]
  );

  const isOvertime = durationJp >= 9;

  // Metadata shift terpilih saat ini
  const currentShiftMeta = useMemo(() => {
    const matched = shiftOptions.find((o) => o.hours === durationJp);
    if (matched) return matched;
    if (durationJp >= 9) {
      return {
        hours: durationJp,
        title: `${durationJp} Jam (Lembur Proyek)`,
        subtitle: "Jam kerja tambahan melebihi 8 jam",
        badge: "Lembur",
        isOvertime: true,
      };
    }
    return {
      hours: durationJp,
      title: `${durationJp} Jam Kerja Riil`,
      subtitle: "Durasi praktik kerja industri",
      badge: `${durationJp} Jam`,
    };
  }, [durationJp, shiftOptions]);

  const handleSelectShift = (hours: number) => {
    onChangeDuration(hours);
    setIsOpen(false);
  };

  const handleMinus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (durationJp > minJp) {
      onChangeDuration(durationJp - 1);
    }
  };

  const handlePlus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (durationJp < maxJp) {
      onChangeDuration(durationJp + 1);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "relative bg-slate-50/60 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 space-y-2 transition-all",
        className
      )}
    >
      {/* ─── LABEL HEADER RAMPING (KEMBAR DENGAN PEMILIH TANGGAL) ─── */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="smart-shift-trigger"
          className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"
        >
          <Clock className="w-3.5 h-3.5 text-sky-600" />
          <span>Jam Kerja Industri (Shift Presensi)</span>
        </label>
        <span className="text-[11px] font-medium text-slate-500">
          Ekuivalen: <strong className="text-sky-700 font-semibold">≈ {equivalentJp} JP</strong>
        </span>
      </div>

      {/* ─── TRIGGER BUTTON RAMPING (~42px) KONSISTEN DENGAN TANGGAL ─── */}
      <button
        id="smart-shift-trigger"
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between gap-2.5 px-3.5 py-2 sm:py-2.5 rounded-xl bg-white border text-left transition-all duration-150 shadow-2xs group cursor-pointer select-none",
          isOpen
            ? "border-sky-500 ring-2 ring-sky-500/20 shadow-xs"
            : "border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50"
        )}
      >
        {/* Kiri: Ikon & Detail Shift Terpilih */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
              isOvertime
                ? "bg-amber-50 text-amber-600 border border-amber-200/60"
                : "bg-sky-50 text-sky-600 border border-sky-100"
            )}
          >
            {isOvertime ? (
              <AlertTriangle className="w-4 h-4" />
            ) : durationJp === 8 ? (
              <Sparkles className="w-4 h-4" />
            ) : (
              <Briefcase className="w-4 h-4" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">
                {durationJp} Jam Kerja
              </span>
              <span className="text-xs text-slate-400 font-normal">·</span>
              <span className="text-xs text-slate-600 font-medium truncate">
                {currentShiftMeta.title}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-none mt-0.5 truncate font-normal">
              {currentShiftMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Kanan: Badge Status & Panah Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          {isOvertime ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/70 text-[10px] font-medium">
              <span>Lembur</span>
            </span>
          ) : durationJp === 8 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10px] font-medium">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
              <span>Standar Baku</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/70 text-[10px] font-medium">
              <span>{currentShiftMeta.badge}</span>
            </span>
          )}

          <ChevronDown
            className={cn(
              "w-4 h-4 text-slate-400 transition-transform duration-200",
              isOpen && "rotate-180 text-sky-600"
            )}
          />
        </div>
      </button>

      {/* ─── FLOATING POPOVER: PILIHAN SHIFT BERSIH & RAPI ─── */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Daftar Pilihan Shift Jam Kerja"
          className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/10 p-2 space-y-1 animate-in fade-in-0 zoom-in-95 duration-150 backdrop-blur-sm"
        >
          {/* Header Popover */}
          <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Template Shift Industri</span>
            <span>Beban JP</span>
          </div>

          {/* Opsi Shift Utama */}
          <div className="space-y-1">
            {shiftOptions.map((opt) => {
              const isSelected = durationJp === opt.hours;
              const jp = convertRealHoursToJp(opt.hours).toFixed(1);

              return (
                <button
                  key={opt.hours}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectShift(opt.hours)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer select-none",
                    isSelected
                      ? "bg-sky-50 text-sky-950 font-semibold border border-sky-200/90 shadow-2xs"
                      : "hover:bg-slate-50 text-slate-700 active:scale-[0.99] border border-transparent"
                  )}
                >
                  {/* Kiri: Radio & Info Shift */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center border transition-all shrink-0",
                        isSelected
                          ? "bg-sky-500 border-sky-500 text-white"
                          : "border-slate-300 bg-white"
                      )}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            isSelected ? "text-sky-950" : "text-slate-800"
                          )}
                        >
                          {opt.hours} Jam Kerja
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          · {opt.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-normal leading-tight">
                        {opt.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Kanan: JP Badge */}
                  <div className="shrink-0 text-right">
                    <span
                      className={cn(
                        "inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md",
                        isSelected
                          ? "bg-sky-100 text-sky-800"
                          : opt.isOvertime
                            ? "bg-amber-50 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                      )}
                    >
                      ≈ {jp} JP
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Garis Pemisah */}
          <div className="border-t border-slate-100 my-1.5" />

          {/* Stepper Halus untuk Jam Kustom (1 - 12) */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
            <div>
              <span className="text-xs font-semibold text-slate-700 block">
                Sesuaikan Jam Khusus (1 - 12 Jam):
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Gunakan tombol untuk menambah atau mengurangi
              </span>
            </div>

            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                onClick={handleMinus}
                disabled={durationJp <= minJp}
                className="w-7 h-7 rounded-md bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 transition cursor-pointer active:scale-95"
                title="Kurangi 1 jam"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span className="text-xs font-semibold text-slate-800 px-2 min-w-[50px] text-center">
                {durationJp} Jam
              </span>

              <button
                type="button"
                onClick={handlePlus}
                disabled={durationJp >= maxJp}
                className="w-7 h-7 rounded-md bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 transition cursor-pointer active:scale-95"
                title="Tambah 1 jam"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── JUSTIFIKASI LEMBUR / PROYEK KHUSUS (DOKUMENTASI K3 & GURU PEMBIMBING) ─── */}
      {isOvertime ? (
        <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Justifikasi Proyek Lembur ({durationJp} Jam):</span>
            </span>
            <span className="text-[10px] text-amber-700 font-medium">Wajib Sesuai SOP</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {OVERTIME_JUSTIFICATIONS.map((just) => {
              const isSelected = overtimeReason === just.id;
              return (
                <button
                  key={just.id}
                  type="button"
                  onClick={() => onChangeOvertimeReason?.(just.id)}
                  className={cn(
                    "p-2 rounded-lg text-left transition-all border text-xs cursor-pointer active:scale-95 flex items-center justify-between gap-1.5",
                    isSelected
                      ? "bg-amber-100/90 text-amber-950 font-semibold border-amber-300 shadow-2xs"
                      : "bg-white text-slate-700 hover:bg-slate-50 border-amber-200/60"
                  )}
                  title={just.desc}
                >
                  <span className="truncate text-[11px] leading-tight">{just.label}</span>
                  {isSelected && <Check className="w-3 h-3 text-amber-700 shrink-0 stroke-[3]" />}
                </button>
              );
            })}
          </div>

          <p className="text-[10.5px] text-amber-800/80 font-normal leading-tight">
            Dicatat transparan agar guru pembimbing mengetahui bahwa jam lembur adalah penugasan resmi proyek industri, bukan eksploitasi kerja.
          </p>
        </div>
      ) : (
        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-normal leading-snug">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Standar alokasi harian 8 jam riil setara 10.7 JP untuk pemenuhan beban 792 JP.</span>
        </p>
      )}

      {/* ─── WARNING ALERT JIKA SUDAH ADA LOG PADA TANGGAL TERPILIH ─── */}
      {existingDailyJp > 0 && (
        <div
          className={cn(
            "p-3 rounded-xl border text-[11px] leading-snug space-y-1 animate-in fade-in mt-1",
            existingDailyJp + durationJp > maxJp
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-amber-50/70 border-amber-200/70 text-amber-800"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
              <span>
                Tanggal ini sudah memiliki <strong>{existingDailyJp} Jam</strong> tercatat sebelumnya.
                {existingDailyJp + durationJp > maxJp
                  ? ` Total ${existingDailyJp + durationJp} Jam melebihi batas maksimal 12 jam harian.`
                  : ` Sisa kuota aman hari ini: ${remainingDailyQuota - durationJp} Jam.`}
              </span>
            </div>

            {onResetTodayLogs && (
              <button
                type="button"
                onClick={onResetTodayLogs}
                className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1 shrink-0 cursor-pointer underline active:scale-95 ml-2"
                title="Hapus log tersimpan pada tanggal ini agar form bersih untuk simulasi demo juri"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Demo</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

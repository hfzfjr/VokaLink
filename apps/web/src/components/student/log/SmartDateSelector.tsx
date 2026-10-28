"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Calendar,
  Clock,
  Check,
  ChevronDown,
  HeartPulse,
  FileText,
  Sparkles,
  Info,
} from "lucide-react";
import { cn } from "@/lib/cn";

export interface LogDateItem {
  logDate: string;
  durationJp: number;
  attendanceType?: "PRESENT" | "SICK" | "PERMIT";
}

interface SmartDateSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  minDate: string;
  maxDate: string;
  offlineLogs?: LogDateItem[];
  stepNumber?: number;
  className?: string;
}

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const SHORT_MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

function parseIsoParts(iso: string) {
  const parts = iso.split("-").map(Number);
  return {
    year: parts[0] || 2026,
    month: (parts[1] || 1) - 1,
    day: parts[2] || 1,
  };
}

function formatIso(year: number, month: number, day: number): string {
  const y = String(year);
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function SmartDateSelector({
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
  offlineLogs = [],
  _stepNumber = 2,
  className,
}: SmartDateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
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

  // Generate 4 hari valid sesuai aturan backdate maksimal H-3 (BR-003)
  const dateOptions = useMemo(() => {
    const { year, month, day } = parseIsoParts(maxDate);
    const baseDate = new Date(year, month, day);

    return [0, 1, 2, 3].map((offset) => {
      const targetDate = new Date(baseDate);
      targetDate.setDate(targetDate.getDate() - offset);

      const iso = formatIso(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate()
      );

      let title = "Hari Ini";
      let shortTag = "Hari Berjalan";
      if (offset === 1) {
        title = "Kemarin";
        shortTag = "H - 1";
      } else if (offset === 2) {
        title = "2 Hari Lalu";
        shortTag = "H - 2";
      } else if (offset === 3) {
        title = "3 Hari Lalu";
        shortTag = "Batas H - 3";
      }

      const dayName = DAY_NAMES[targetDate.getDay()];
      const dayNum = targetDate.getDate();
      const monthShort = SHORT_MONTH_NAMES[targetDate.getMonth()];
      const fullFormatted = `${dayName}, ${dayNum} ${MONTH_NAMES[targetDate.getMonth()]} ${targetDate.getFullYear()}`;

      // Periksa akumulasi log pada hari ini
      const dayLogs = offlineLogs.filter((l) => l.logDate === iso);
      const totalJp = dayLogs.reduce((acc, curr) => acc + (curr.durationJp || 0), 0);
      const hasSick = dayLogs.some((l) => l.attendanceType === "SICK");
      const hasPermit = dayLogs.some((l) => l.attendanceType === "PERMIT");

      return {
        offset,
        iso,
        title,
        shortTag,
        dayName,
        dayNum,
        monthShort,
        fullFormatted,
        totalJp,
        hasSick,
        hasPermit,
        logCount: dayLogs.length,
      };
    });
  }, [maxDate, offlineLogs]);

  // Deteksi item aktif
  const activeItem = dateOptions.find((d) => d.iso === selectedDate);
  const isBackdate = activeItem ? activeItem.offset > 0 : selectedDate !== maxDate;

  const handleSelect = (iso: string) => {
    onSelectDate(iso);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "relative py-5 border-b border-slate-100 space-y-2 transition-all",
        className
      )}
    >
      {/* Label Header Apple HIG Style */}
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor="smart-date-trigger"
          className="text-[11px] font-medium text-slate-500 uppercase tracking-widest flex items-center gap-1.5"
        >
          <Calendar className="w-3.5 h-3.5 text-sky-600" />
          <span>Tanggal Pelaksanaan Kegiatan</span>
        </label>
        <span className="text-xs text-slate-400 font-medium">
          Maks. H-3 (72 Jam)
        </span>
      </div>

      {/* Trigger Button: Ramping, Kompak (~42px) & Berisi Informasi Lengkap */}
      <button
        id="smart-date-trigger"
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border text-left transition-all duration-150 shadow-2xs group cursor-pointer select-none min-h-[44px]",
          isOpen
            ? "border-sky-500 ring-2 ring-sky-500/20 shadow-xs"
            : "border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50"
        )}
      >
        {/* Kiri: Ikon & Detail Tanggal Terpilih */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
              isBackdate
                ? "bg-slate-100 text-slate-600 border border-slate-200"
                : "bg-sky-50 text-sky-600 border border-sky-100"
            )}
          >
            {isBackdate ? <Clock className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">
                {activeItem ? activeItem.title : selectedDate}
              </span>
              <span className="text-xs text-slate-500 font-normal">·</span>
              <span className="text-xs text-slate-700 font-medium truncate">
                {activeItem ? activeItem.fullFormatted : selectedDate}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-none mt-0.5 truncate font-normal">
              {isBackdate
                ? "Pengisian susulan diverifikasi resmi via PIN mentor"
                : "Pencatatan langsung hari berjalan"}
            </p>
          </div>
        </div>

        {/* Kanan: Badge Status & Panah Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          {activeItem?.hasSick ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200/70 text-xs font-medium">
              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
              <span>Sakit</span>
            </span>
          ) : activeItem?.hasPermit ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>Izin</span>
            </span>
          ) : activeItem && activeItem.totalJp >= 8 ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-700 border border-slate-200 text-xs font-medium">
              <Check className="w-3.5 h-3.5 text-slate-600" />
              <span>{activeItem.totalJp} JP Lengkap</span>
            </span>
          ) : isBackdate ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
              <span>Susulan</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-slate-600 border border-slate-200 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Tepat Waktu</span>
            </span>
          )}

          <ChevronDown
            className={cn(
              "w-4 h-4 text-slate-500 transition-transform duration-200",
              isOpen && "rotate-180 text-sky-600"
            )}
          />
        </div>
      </button>

      {/* Floating Popover / Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Daftar Pilihan Tanggal"
          className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/10 p-2 space-y-1 animate-in fade-in-0 zoom-in-95 duration-150 backdrop-blur-sm"
        >
          {/* Header Popover */}
          <div className="flex items-center justify-between px-2.5 py-1 text-xs font-semibold text-slate-600">
            <span>OPSI TANGGAL (BATAS H-3):</span>
            <span className="font-normal text-slate-500">Maksimal 3 Hari Lalu</span>
          </div>

          {/* 4 Opsi Cepat */}
          <div className="space-y-1">
            {dateOptions.map((opt) => {
              const isSelected = selectedDate === opt.iso;

              return (
                <button
                  key={opt.iso}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.iso)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer select-none min-h-[44px]",
                    isSelected
                      ? "bg-sky-50 text-sky-950 font-semibold border border-sky-200/90 shadow-2xs"
                      : "hover:bg-slate-50 text-slate-700 active:scale-[0.99] border border-transparent"
                  )}
                >
                  {/* Kiri: Radio Indikator + Nama Hari & Tanggal */}
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
                          {opt.title}
                        </span>
                        <span className="text-xs text-slate-600 font-normal">
                          ({opt.shortTag})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-normal leading-tight">
                        {opt.fullFormatted}
                      </p>
                    </div>
                  </div>

                  {/* Kanan: Badge Status Pengisian */}
                  <div className="shrink-0">
                    {opt.hasSick ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200/70 text-xs font-medium">
                        <HeartPulse className="w-3 h-3 text-rose-600" />
                        <span>Sakit</span>
                      </span>
                    ) : opt.hasPermit ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
                        <FileText className="w-3 h-3 text-slate-600" />
                        <span>Izin</span>
                      </span>
                    ) : opt.totalJp >= 8 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-700 border border-slate-200 text-xs font-medium">
                        <Check className="w-3 h-3 text-slate-600" />
                        <span>{opt.totalJp} JP Lengkap</span>
                      </span>
                    ) : opt.totalJp > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200/70 text-xs font-medium">
                        <Clock className="w-3 h-3 text-sky-600" />
                        <span>{opt.totalJp} JP Terisi</span>
                      </span>
                    ) : opt.offset === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                        <span>Belum Diisi</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>Perlu Diisi</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Garis Pemisah */}
          <div className="border-t border-slate-100 my-1.5" />

          {/* Opsi Kalender Manual */}
          <div className="px-1 py-0.5">
            <button
              type="button"
              onClick={() => setShowManualInput((prev) => !prev)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-50 text-xs font-medium transition cursor-pointer min-h-[40px]"
            >
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Pilih dari Kalender Manual</span>
              </span>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-slate-500 transition-transform duration-150",
                  showManualInput && "rotate-180"
                )}
              />
            </button>

            {showManualInput && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 animate-in fade-in motion-reduce:animate-none duration-100">
                <label htmlFor="manual-log-date" className="text-xs font-medium text-slate-700 block">
                  Kalender Manual ({minDate} s/d {maxDate}):
                </label>
                <input
                  id="manual-log-date"
                  type="date"
                  value={selectedDate}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => {
                    onSelectDate(e.target.value);
                    setIsOpen(false);
                  }}
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition min-h-[40px]"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keterangan Ramping 1 Baris di Bawah Input */}
      {isBackdate ? (
        <p className="text-xs text-amber-800 flex items-center gap-1.5 font-medium animate-in fade-in motion-reduce:animate-none leading-snug">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Pengisian susulan (<strong>{activeItem?.title || selectedDate}</strong>): Tetap sah tercatat dan diverifikasi mentor via PIN.
          </span>
        </p>
      ) : (
        <p className="text-xs text-slate-600 flex items-center gap-1.5 font-normal leading-snug">
          <Info className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Batas pengisian maksimal 3 hari kerja ke belakang (72 jam) untuk mencegah rapelan fiktif.</span>
        </p>
      )}
    </div>
  );
}

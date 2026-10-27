"use client";

import React from "react";
import {
  Building2,
  Search,
  Plus,
} from "lucide-react";

interface DudiToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedCity: string;
  onCityChange: (val: string) => void;
  cities: string[];
  onOpenAddModal: () => void;
  totalPartners: number;
}

export function DudiToolbar({
  search,
  onSearchChange,
  selectedCity,
  onCityChange,
  cities,
  onOpenAddModal,
  totalPartners,
}: DudiToolbarProps) {
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
      {/* Title & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-start sm:items-center justify-between sm:justify-start gap-2.5">
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 min-w-0">
              <Building2 className="w-5 h-5 text-sky-500 shrink-0" />
              <span>Direktori Mitra DUDI & Mentor</span>
            </h1>
            <span className="inline-flex items-center justify-center whitespace-nowrap shrink-0 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-extrabold text-xs border border-sky-100 mt-0.5 sm:mt-0">
              {totalPartners} Mitra
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola direktori mitra industri, kuota penempatan, dan tautan aktivasi HP mentor.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Daftarkan Mitra Baru</span>
        </button>
      </div>

      {/* Search & City Filter Bar */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama mitra industri..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <select
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shrink-0 cursor-pointer"
          >
            <option value="Semua">Semua Kota</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Building2,
  Search,
  Plus,
  Award,
  Compass,
} from "lucide-react";

interface DudiToolbarProps {
  activeTab: "DIRECTORY" | "QUALITY_INDEX";
  onTabChange: (tab: "DIRECTORY" | "QUALITY_INDEX") => void;
  search: string;
  onSearchChange: (val: string) => void;
  selectedCity: string;
  onCityChange: (val: string) => void;
  cities: string[];
  onOpenAddModal: () => void;
  totalPartners: number;
}

export function DudiToolbar({
  activeTab,
  onTabChange,
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
          <Link
            href="/school/dashboard"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dasbor</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-500" />
              Direktori Kemitraan DUDI & Mentor
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-extrabold text-xs border border-sky-100">
              {totalPartners} Mitra
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen direktori mitra industri terfederasi, ikatan perangkat HP mentor, dan audit DUDI Quality Index.
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

      {/* Tabs & Search Filter Bar */}
      <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl shrink-0 self-start">
          <button
            type="button"
            onClick={() => onTabChange("DIRECTORY")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "DIRECTORY"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Direktori Mitra</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange("QUALITY_INDEX")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "QUALITY_INDEX"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>DUDI Quality Index</span>
          </button>
        </div>

        {/* Search & City Filter */}
        {activeTab === "DIRECTORY" && (
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama mitra industri..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shrink-0 cursor-pointer"
            >
              <option value="Semua">Semua Kota</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

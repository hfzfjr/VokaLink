"use client";

import React from "react";
import { Search, Compass, Users } from "lucide-react";

interface PlacementFilterBarProps {
  activeTab: "RECOMMENDATIONS" | "ACTIVE_LIST";
  onTabChange: (tab: "RECOMMENDATIONS" | "ACTIVE_LIST") => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedDeptId: string;
  onDeptChange: (val: string) => void;
  departments: Array<{ id: string; sectorCode: string; name: string }>;
  unplacedCount: number;
  activeCount: number;
}

export function PlacementFilterBar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedDeptId,
  onDeptChange,
  departments,
  unplacedCount,
  activeCount,
}: PlacementFilterBarProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      {/* Tabs Switcher (Full width grid on mobile & tablet, inline on desktop) */}
      <div className="w-full lg:w-auto grid grid-cols-2 lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl shrink-0">
        <button
          type="button"
          onClick={() => onTabChange("RECOMMENDATIONS")}
          className={`flex items-center justify-center gap-2 px-2.5 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
            activeTab === "RECOMMENDATIONS"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Compass className="w-4.5 h-4.5 sm:w-4 sm:h-4 shrink-0 text-sky-500" />
          <span className="text-[11px] sm:text-xs leading-tight text-left sm:text-center">Kandidat & Rekomendasi</span>
          <span className="px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 font-extrabold text-[10px] border border-amber-200 shrink-0">
            {unplacedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("ACTIVE_LIST")}
          className={`flex items-center justify-center gap-2 px-2.5 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
            activeTab === "ACTIVE_LIST"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4.5 h-4.5 sm:w-4 sm:h-4 shrink-0 text-slate-500" />
          <span className="text-[11px] sm:text-xs leading-tight text-left sm:text-center">Daftar Penempatan Aktif</span>
          <span className="px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 font-extrabold text-[10px] shrink-0">
            {activeCount}
          </span>
        </button>
      </div>

      {/* Search & Department Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full lg:w-auto">
        <div className="relative flex-1 w-full min-w-0 sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama atau NISN siswa..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 pl-9 pr-3.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-2xs truncate"
          />
        </div>

        {departments.length > 0 && (
          <div className="w-full sm:w-auto shrink-0 min-w-0">
            <select
              value={selectedDeptId}
              onChange={(e) => onDeptChange(e.target.value)}
              className="w-full sm:w-auto max-w-full sm:max-w-[260px] lg:max-w-[300px] h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer truncate shadow-2xs"
            >
              <option value="ALL">Semua Jurusan</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  [{dept.sectorCode}] {dept.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

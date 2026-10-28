"use client";

import React from "react";
import { Search, Download, RefreshCw } from "lucide-react";

interface EraporFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedDeptId: string;
  onDeptChange: (val: string) => void;
  departments: Array<{ id: string; name: string }>;
  onDownloadCsv: () => void;
  downloadingCsv: boolean;
}

export function EraporFilterToolbar({
  searchQuery,
  onSearchChange,
  selectedDeptId,
  onDeptChange,
  departments,
  onDownloadCsv,
  downloadingCsv,
}: EraporFilterToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Search & Department Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 max-w-xl w-full">
        <div className="relative flex-1 w-full min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari siswa, NISN, atau mitra DUDI..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 pl-9 pr-3.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-2xs"
          />
        </div>

        {departments.length > 0 && (
          <div className="w-full sm:w-auto shrink-0 min-w-0">
            <select
              value={selectedDeptId}
              onChange={(e) => onDeptChange(e.target.value)}
              className="w-full sm:w-auto max-w-full sm:max-w-[220px] md:max-w-[240px] h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer truncate shadow-2xs"
            >
              <option value="ALL">Semua Jurusan</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* CSV Export Action Button */}
      <button
        type="button"
        onClick={onDownloadCsv}
        disabled={downloadingCsv}
        className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition shadow-xs w-full sm:w-auto cursor-pointer disabled:opacity-50"
      >
        {downloadingCsv ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span>{downloadingCsv ? "Mengunduh CSV..." : "Ekspor CSV e-Rapor"}</span>
      </button>
    </div>
  );
}

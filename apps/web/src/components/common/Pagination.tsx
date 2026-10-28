"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (nextPage: number) => void;
  itemLabel?: string;
  loading?: boolean;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  itemLabel = "data",
  loading = false,
}: PaginationProps) {
  if (totalItems <= 0) return null;

  const startItem = Math.min(totalItems, (page - 1) * limit + 1);
  const endItem = Math.min(totalItems, page * limit);

  // Build page number list with ellipsis
  const getPageNumbers = (): Array<number | "ellipsis"> => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: Array<number | "ellipsis"> = [1];

    if (page > 3) {
      pages.push("ellipsis");
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (page < totalPages - 2) {
      pages.push("ellipsis");
    }

    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
      <p className="text-xs text-slate-600 font-medium">
        Menampilkan{" "}
        <span className="font-extrabold text-slate-900 tabular-nums">
          {startItem}–{endItem}
        </span>{" "}
        dari{" "}
        <span className="font-extrabold text-slate-900 tabular-nums">
          {totalItems}
        </span>{" "}
        {itemLabel}
      </p>

      {totalPages > 1 && (
        <nav
          aria-label="Navigasi Halaman"
          className="flex items-center gap-1.5"
        >
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          <div className="flex items-center gap-1">
            {pageNumbers.map((item, idx) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 h-9 flex items-center justify-center text-xs font-bold text-slate-400 select-none"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  disabled={loading}
                  onClick={() => onPageChange(item)}
                  aria-current={item === page ? "page" : undefined}
                  className={`min-w-[36px] h-9 px-2.5 rounded-xl text-xs font-extrabold tabular-nums transition cursor-pointer ${
                    item === page
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
          >
            <span className="hidden sm:inline">Berikutnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </nav>
      )}
    </div>
  );
}

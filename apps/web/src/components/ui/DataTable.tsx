"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { SkeletonRect } from "./Skeleton";

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface Column<T> {
  key: keyof T | string;
  header: string;
  /** Width hint for desktop (CSS value, e.g. "8rem") */
  width?: string;
  render?: (row: T, idx: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  /** Unique key per row */
  getRowKey: (row: T, idx: number) => string | number;
  /** Called when a row is clicked */
  onRowClick?: (row: T) => void;
  loading?: boolean;
  empty?: React.ReactNode;
  className?: string;
  /** Caption for accessibility */
  caption?: string;
}

function getCellValue<T>(row: T, key: keyof T | string): React.ReactNode {
  return (row as Record<string, unknown>)[key as string] as React.ReactNode;
}

// ─── Mobile card layout ────────────────────────────────────────────────────────
function MobileCard<T>({
  row,
  columns,
  idx,
  onClick,
}: {
  row: T;
  columns: Column<T>[];
  idx: number;
  onClick?: () => void;
}) {
  if (!columns.length) return null;
  const [first, ...rest] = columns as [Column<T>, ...Column<T>[]];
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-white p-4",
        onClick && "cursor-pointer hover:bg-ink-50 transition-colors duration-150"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {/* Primary column displayed prominently */}
      <div className={cn("text-sm font-semibold text-ink-900 mb-2", first.className)}>
        {first.render ? first.render(row, idx) : getCellValue(row, first.key)}
      </div>
      {/* Rest as label: value pairs */}
      <dl className="space-y-1">
        {rest.map((col) => (
          <div key={String(col.key)} className="flex items-start justify-between gap-2">
            <dt className="text-xs font-medium text-ink-500 shrink-0">{col.header}</dt>
            <dd className={cn("text-xs text-ink-700 text-right", col.className)}>
              {col.render ? col.render(row, idx) : getCellValue(row, col.key)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ─── DataTable ─────────────────────────────────────────────────────────────────
export function DataTable<T>({
  columns,
  data,
  getRowKey,
  onRowClick,
  loading = false,
  empty,
  className,
  caption,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Mobile skeleton */}
        <div className="md:hidden space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-line bg-white p-4 space-y-2">
              <SkeletonRect className="h-4 w-2/3 rounded" />
              <SkeletonRect className="h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
        {/* Desktop skeleton */}
        <div className="hidden md:block rounded-xl border border-line overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-line bg-ink-50">
              <tr>
                {columns.map((col) => (
                  <th key={String(col.key)} className="px-4 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wide">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3">
                      <SkeletonRect className="h-4 rounded" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={cn("rounded-xl border border-line bg-white p-8 text-center text-sm text-ink-500", className)}>
        {empty ?? "Belum ada data."}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-3">
        {data.map((row, idx) => (
          <MobileCard
            key={getRowKey(row, idx)}
            row={row}
            columns={columns}
            idx={idx}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block rounded-xl border border-line overflow-hidden">
        <table className="w-full">
          {caption && (
            <caption className="sr-only">{caption}</caption>
          )}
          <thead className="border-b border-line bg-ink-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wide",
                    col.headerClassName
                  )}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {data.map((row, idx) => (
              <tr
                key={getRowKey(row, idx)}
                className={cn(
                  "transition-colors duration-150",
                  onRowClick && "cursor-pointer hover:bg-ink-50"
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn("px-4 py-3 text-sm text-ink-900", col.className)}
                  >
                    {col.render ? col.render(row, idx) : getCellValue(row, col.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;

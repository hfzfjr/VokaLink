"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  QrCode,
  PlusCircle,
  Search,
  X,
  ShieldCheck,
  Calendar,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { type KanbanTask, getCategoryDotColor, getCategoryShortLabel } from "./types";

interface DailyTimelineFeedProps {
  tasks: KanbanTask[];
  onSelectTask: (task: KanbanTask) => void;
  onOpenQrModal: () => void;
}

export function DailyTimelineFeed({
  tasks,
  onSelectTask,
  onOpenQrModal,
}: DailyTimelineFeedProps) {
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_REVIEW" | "VERIFIED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter tasks based on status and search query
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Status Filter
      if (statusFilter === "IN_REVIEW" && t.status !== "in_review" && t.status !== "in_progress") {
        return false;
      }
      if (statusFilter === "VERIFIED" && t.status !== "verified") {
        return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesCategory = t.category.toLowerCase().includes(q);
        const matchesDate = t.date.toLowerCase().includes(q);
        const matchesTools = t.tools.some((tool) => tool.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCategory && !matchesDate && !matchesTools) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, statusFilter, searchQuery]);

  const pendingCount = useMemo(
    () => tasks.filter((t) => t.status === "in_review" || t.status === "in_progress").length,
    [tasks]
  );
  const verifiedCount = useMemo(
    () => tasks.filter((t) => t.status === "verified").length,
    [tasks]
  );

  return (
    <div className="space-y-3.5">
      {/* ─── Control Bar: Status Filter Tabs & Search ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        {/* Status Filter Segmented Buttons - Adaptive on Mobile */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 text-xs font-semibold w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={cn(
              "flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5",
              statusFilter === "ALL"
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium"
            )}
          >
            <span className="hidden sm:inline">Semua Jurnal</span>
            <span className="sm:hidden">Semua</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200/60 text-slate-700 text-[10px] font-mono">
              {tasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("IN_REVIEW")}
            className={cn(
              "flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5",
              statusFilter === "IN_REVIEW"
                ? "bg-white text-amber-700 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="hidden sm:inline">Menunggu Validasi</span>
            <span className="sm:hidden">Antrean</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-semibold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("VERIFIED")}
            className={cn(
              "flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5",
              statusFilter === "VERIFIED"
                ? "bg-white text-emerald-700 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="hidden sm:inline">Sah Terverifikasi</span>
            <span className="sm:hidden">Sah</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono">
              {verifiedCount}
            </span>
          </button>
        </div>

        {/* Search Input in Timeline */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tanggal, tugas, tools..."
            className="w-full bg-slate-50 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 font-normal pl-8.5 pr-7 py-1.5 rounded-xl border border-slate-200/70 transition focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Timeline Feed Cards List ─── */}
      {filteredTasks.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/50 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 mx-auto shadow-2xs">
            <Inbox className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">
              Tidak Ada Jurnal yang Sesuai
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto font-normal">
              {searchQuery
                ? `Tidak ditemukan catatan jurnal dengan kata kunci "${searchQuery}".`
                : statusFilter === "IN_REVIEW"
                ? "Bagus sekali! Semua jurnal Anda telah diverifikasi oleh mentor industri."
                : "Belum ada catatan jurnal pada filter ini."}
            </p>
          </div>
          <Link
            href="/student/log/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold transition active:scale-95 shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Tambah Jurnal Baru</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const isVerified = task.status === "verified";
            const dotColor = getCategoryDotColor(task.categoryColor);

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className={cn(
                  "p-3.5 sm:p-4.5 rounded-2xl border transition-all duration-150 cursor-pointer group hover:shadow-card active:scale-[0.99] relative bg-white",
                  isVerified
                    ? "border-slate-200/70 hover:border-slate-300"
                    : "border-amber-200/80 bg-amber-50/20 hover:border-amber-300"
                )}
              >
                {/* Top Row: Date & Duration (Left) vs Status / QR PIN Button (Right) */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900">
                      <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>{task.date}</span>
                    </span>

                    <span className="text-slate-300">·</span>

                    <span className="px-1.5 py-0.2 rounded bg-slate-100 font-semibold text-[10px] text-slate-700 font-mono">
                      {task.durationJp} Jam
                    </span>

                    <span className="text-slate-300 hidden sm:inline">·</span>

                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
                      <span>{getCategoryShortLabel(task.category)}</span>
                    </span>
                  </div>

                  {/* Status Badge or QR PIN button */}
                  <div className="shrink-0">
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                        <span>Sah</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenQrModal();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-[10.5px] font-semibold shadow-2xs transition cursor-pointer"
                        title="Buka QR Verifikasi Mentor"
                      >
                        <QrCode className="w-3 h-3" />
                        <span>QR PIN</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Task Title */}
                <h3 className="text-[13.5px] sm:text-[14.5px] font-semibold text-slate-900 group-hover:text-sky-600 transition-colors leading-snug">
                  {task.title}
                </h3>

                {/* Short Note if exists */}
                {task.shortNote && (
                  <p className="text-xs text-slate-500 font-normal mt-1 line-clamp-2 leading-relaxed">
                    &quot;{task.shortNote}&quot;
                  </p>
                )}

                {/* Footer Meta: Tools + Category + Mentor / Sync Info */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-100/80">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex sm:hidden items-center gap-1 text-[10px] text-slate-500 font-medium">
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
                      <span>{getCategoryShortLabel(task.category)}</span>
                    </span>
                    <span className="sm:hidden text-slate-300">·</span>
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200/60 px-1.5 py-0.2 rounded">
                      {task.autonomyLabel}
                    </span>
                    {task.tools.slice(0, 2).map((tool) => (
                      <span
                        key={tool}
                        className="text-[9.5px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200/40"
                      >
                        {tool}
                      </span>
                    ))}
                    {task.tools.length > 2 && (
                      <span className="text-[9px] text-slate-400 font-mono">
                        +{task.tools.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Mentor Signature or Offline Sync Badge */}
                  <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400">
                    {isVerified ? (
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span className="hidden sm:inline">Disahkan</span>
                        <span>{task.mentorSignature || "Mentor DUDI"}</span>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-normal">
                        {task.submittedAt || "Tersimpan offline"}
                      </span>
                    )}

                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

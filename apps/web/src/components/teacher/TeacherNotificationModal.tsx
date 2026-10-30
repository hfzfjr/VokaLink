"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  X,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  CheckCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";

export interface StudentDriftAlertItem {
  id: string;
  fullName: string;
  dudiName: string;
  alertType?: string;
  message?: string;
}

export interface RecentLogNotificationItem {
  id: string;
  studentName: string;
  title: string;
  jp: number;
  timeAgo: string;
  status: "VERIFIED" | "PENDING";
}

export interface TeacherNotificationModalProps {
  onClose: () => void;
  driftCount?: number;
  studentsWithDrift?: StudentDriftAlertItem[];
  recentLogs?: RecentLogNotificationItem[];
  securityFlagsCount?: number;
  onOpenIntervention?: (studentId: string) => void;
  onViewSecurity?: () => void;
}

export function TeacherNotificationModal({
  onClose,
  driftCount = 0,
  studentsWithDrift = [],
  recentLogs = [],
  securityFlagsCount = 0,
  onOpenIntervention,
  onViewSecurity,
}: TeacherNotificationModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "DRIFT" | "LOGS" | "SECURITY">("ALL");
  const [isMarkedAllRead, setIsMarkedAllRead] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close on Escape key press & lock body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  if (!isMounted || typeof document === "undefined") return null;

  // Default fallback data jika tidak diparsing via props
  const effectiveDriftList: StudentDriftAlertItem[] =
    studentsWithDrift.length > 0
      ? studentsWithDrift
      : driftCount > 0
      ? [
          {
            id: "demo-drift-1",
            fullName: "Andi Pratama",
            dudiName: "PT Telkom Indonesia",
            alertType: "NON_COMPETENCY_OVERLOAD",
            message: "Rasio penugasan non-kompetensi mencapai 35% (batas maksimal toleransi 30%).",
          },
        ]
      : [];

  const effectiveRecentLogs: RecentLogNotificationItem[] =
    recentLogs.length > 0
      ? recentLogs
      : [
          {
            id: "log-1",
            studentName: "Budi Santoso",
            title: "Implementasi RESTful API & Unit Testing",
            jp: 8,
            timeAgo: "1 jam lalu",
            status: "VERIFIED",
          },
          {
            id: "log-2",
            studentName: "Citra Lestari",
            title: "Desain UI Komponen Figma & Slicing CSS",
            jp: 8,
            timeAgo: "3 jam lalu",
            status: "PENDING",
          },
        ];

  const totalNotifs = isMarkedAllRead
    ? 0
    : effectiveDriftList.length + effectiveRecentLogs.length + (securityFlagsCount > 0 ? 1 : 0);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-notif-title"
      className="fixed inset-0 z-[999] bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in-0 duration-150"
      style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden border border-slate-200/80 shadow-2xl flex flex-col animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="pt-2.5 sm:hidden flex justify-center shrink-0 bg-white">
          <div className="w-12 h-1.5 bg-slate-300/80 rounded-full" />
        </div>

        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shadow-2xs shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 id="teacher-notif-title" className="text-sm sm:text-base font-bold text-slate-900 leading-snug truncate">
                  Pusat Notifikasi Guru
                </h3>
                {totalNotifs > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 text-[10.5px] font-bold shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>{totalNotifs} Baru</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-semibold shrink-0">
                    Semua Terbaca
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-normal truncate sm:whitespace-normal max-w-[240px] sm:max-w-none mt-0.5">
                Peringatan drift, logbook siswa &amp; audit sistem PKL
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup notifikasi"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer active:scale-95 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Filters (Pill Modern & Anti-Truncate) */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {[
            { key: "ALL", label: "Semua", count: totalNotifs },
            { key: "DRIFT", label: "Alert Drift", count: effectiveDriftList.length },
            { key: "LOGS", label: "Log Masuk", count: effectiveRecentLogs.length },
            { key: "SECURITY", label: "Keamanan", count: securityFlagsCount },
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  "h-8 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0",
                  active
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50"
                )}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={cn(
                      "tabular-nums text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                      active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable Notification List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Section 1: Peringatan Drift */}
          {(activeTab === "ALL" || activeTab === "DRIFT") && effectiveDriftList.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                Peringatan Drift Pembelajaran
              </span>
              {effectiveDriftList.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-2.5 transition hover:border-rose-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs sm:text-sm text-slate-900 leading-tight truncate">
                          {item.fullName}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {item.dudiName}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold shrink-0 border border-rose-200/60">
                      Perlu Intervensi
                    </span>
                  </div>

                  <p className="text-xs text-rose-950 font-normal leading-relaxed pl-10">
                    {item.message || "Terdeteksi defisit kompetensi signifikan terhadap target kurikulum."}
                  </p>

                  <div className="pt-1 flex items-center justify-end gap-2 pl-10">
                    {onOpenIntervention && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenIntervention(item.id);
                        }}
                        className="h-8 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                        <span>Intervensi Pembimbing</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section 2: Log Masuk Siswa */}
          {(activeTab === "ALL" || activeTab === "LOGS") && effectiveRecentLogs.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                Aktivitas Logbook Terbaru
              </span>
              {effectiveRecentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-2 transition hover:border-slate-300 hover:shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 font-bold text-[10.5px] flex items-center justify-center shrink-0 border border-sky-100">
                        {getInitials(log.studentName)}
                      </div>
                      <span className="font-bold text-slate-900 truncate">{log.studentName}</span>
                    </div>
                    <span className="text-slate-400 text-[11px] font-normal shrink-0">{log.timeAgo}</span>
                  </div>

                  <p className="text-xs text-slate-600 font-normal leading-relaxed pl-9">
                    {log.title}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] pl-9">
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {log.jp} JP Praktik
                    </span>
                    {log.status === "VERIFIED" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 text-[10.5px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                        <span>Sah Terverifikasi</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 text-[10.5px]">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Menunggu PIN</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section 3: Keamanan & Integritas */}
          {(activeTab === "ALL" || activeTab === "SECURITY") && (
            <div className="space-y-2.5">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                Integritas Autentikasi &amp; Dual-Factor PIN
              </span>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                        HMAC-SHA256 &amp; Device Binding
                      </p>
                      <p className="text-[11px] text-slate-500 font-normal leading-relaxed mt-0.5">
                        Semua log sah disegel dengan kunci kriptografi server &amp; verifikasi offline.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0 border border-emerald-200/60">
                    Aman
                  </span>
                </div>
                {onViewSecurity && (
                  <div className="pt-1.5 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onViewSecurity();
                      }}
                      className="text-xs text-sky-600 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Buka Catatan Audit Lengkap</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (Aksi Disesuaikan: Rapih, Proporsional, & Fungsional) */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0 pb-[max(env(safe-area-inset-bottom,0px),0.875rem)]">
          <button
            type="button"
            onClick={() => setIsMarkedAllRead(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer active:scale-95"
          >
            <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Tandai Semua Dibaca</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold transition cursor-pointer shadow-xs flex items-center justify-center"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default TeacherNotificationModal;

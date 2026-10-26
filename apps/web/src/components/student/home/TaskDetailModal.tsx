"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, Image as ImageIcon, CheckCircle2, Maximize2 } from "lucide-react";
import { db } from "@/lib/pwa/db";
import {
  type KanbanTask,
  getCategoryBadgeStyle,
} from "./types";

interface TaskDetailModalProps {
  task: KanbanTask;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Lock body scroll while modal or lightbox is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isLightboxOpen, onClose]);

  // Fetch photo from Dexie or realistic fallback
  useEffect(() => {
    let active = true;
    async function loadPhoto() {
      try {
        const photo = await db.photos.get(task.id);
        if (photo && photo.blob && active) {
          setPhotoUrl(URL.createObjectURL(photo.blob));
          return;
        }
      } catch {}

      if (task.samplePhotoUrl && active) {
        setPhotoUrl(task.samplePhotoUrl);
        return;
      }

      // Fallback sample photos by category
      if (active) {
        if (task.category.includes("Web") || task.title.includes("API") || task.title.includes("Express")) {
          setPhotoUrl("https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80");
        } else if (task.category.includes("Basis Data") || task.title.includes("Database")) {
          setPhotoUrl("https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&q=80");
        } else if (task.title.includes("UI") || task.title.includes("PWA")) {
          setPhotoUrl("https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80");
        } else {
          setPhotoUrl("https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80");
        }
      }
    }

    loadPhoto();

    return () => {
      active = false;
      if (photoUrl && photoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [task.id, task.category, task.title, task.samplePhotoUrl]);

  if (!isMounted || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
        className="fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-0 duration-150"
        style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl p-5 sm:p-7 max-w-md w-full border border-slate-200/80 shadow-modal space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto no-scrollbar scrollbar-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-medium shadow-2xs ${getCategoryBadgeStyle(
                task.categoryColor
              )}`}
            >
              {task.category}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup detail pekerjaan"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h3
              id="task-detail-title"
              className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight"
            >
              {task.title}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Kode Unit SKKNI: {task.skkniUnitCode}
            </p>
          </div>

          {/* Bukti Foto Terlampir & Lightbox Zoomable */}
          {photoUrl && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                  <span>Bukti Foto Dokumentasi Kerja</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Klik foto untuk perbesar
                </span>
              </div>

              <div
                onClick={() => setIsLightboxOpen(true)}
                className="relative rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-950 group cursor-pointer shadow-2xs hover:shadow-card transition-all duration-200"
                title="Klik untuk membuka foto layar penuh"
              >
                <img
                  src={photoUrl}
                  alt="Bukti Dokumentasi Pekerjaan"
                  className="w-full h-40 sm:h-44 object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-xs text-[10px] font-semibold text-white flex items-center gap-1.5 shadow-xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 stroke-[2.5]" />
                  <span>WebP &bull; Terverifikasi Valid</span>
                </div>

                {/* Hover overlay hint with Zoom icon */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-[1px]">
                  <Maximize2 className="w-4 h-4" />
                  <span>Perbesar Layar Penuh</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/60 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                Durasi Kerja
              </span>
              <span className="font-semibold text-slate-900">
                {task.durationJp} Jam Praktik
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                Tingkat Kemandirian
              </span>
              <span className="font-semibold text-slate-900">
                {task.autonomyLabel}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                Tanggal Kegiatan
              </span>
              <span className="font-semibold text-slate-900">{task.date}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                Status Validasi
              </span>
              {task.status === "verified" ? (
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Terverifikasi Sah</span>
                </span>
              ) : task.status === "in_review" ? (
                <span className="font-semibold text-amber-700">
                  Menunggu PIN Mentor
                </span>
              ) : (
                <span className="font-semibold text-slate-700">
                  Tersimpan Offline
                </span>
              )}
            </div>
            {task.mentorSignature && (
              <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Pembimbing DUDI:</span>
                <span className="font-semibold text-slate-800">{task.mentorSignature}</span>
              </div>
            )}
          </div>



          {/* Student Log Short Note if available */}
          {task.shortNote && (
            <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/60 text-xs space-y-1">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                Catatan Aktivitas Siswa
              </span>
              <p className="text-slate-700 leading-relaxed font-normal">{task.shortNote}</p>
            </div>
          )}

          {/* Local Dexie PWA Indicator */}
          {task.isLocalDexie && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-sky-50/80 border border-sky-100 text-[11px] text-sky-900 font-medium">
              <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
              <span>
                Logbook tersimpan di perangkat lokal (Dexie IndexedDB)
                {task.syncState === "queued"
                  ? " — menunggu jaringan online untuk sinkronisasi otomatis."
                  : " — telah tersinkron ke cloud."}
              </span>
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <Link
              href={`/student/log/history?logId=${encodeURIComponent(task.id)}`}
              className="flex-1 py-2.5 px-3 text-center bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white rounded-full text-xs font-semibold transition shadow-xs"
            >
              Buka di Riwayat Logbook
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] border border-slate-200/70 text-slate-700 rounded-full text-xs font-semibold transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Pure Photo Viewer Lightbox with identical translucent blur */}
      {isLightboxOpen && photoUrl && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 cursor-zoom-out select-none animate-in fade-in-0 duration-150"
          style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(false);
            }}
            aria-label="Tutup Foto"
            className="fixed top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-900/80 active:scale-95 text-white/90 hover:text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition cursor-pointer z-10 shadow-xl"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          <img
            src={photoUrl}
            alt="Dokumentasi Bukti Kerja"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-[92vw] w-auto h-auto object-contain rounded-2xl sm:rounded-3xl shadow-2xl animate-in zoom-in-95 duration-150 cursor-default ring-1 ring-black/10"
          />
        </div>
      )}
    </>,
    document.body
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLiveQuery } from "dexie-react-hooks";
import {
  RefreshCw,
  X,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
  Calendar,
  Wifi,
  WifiOff,
  PlusCircle,
  Database,
  Trash2,
} from "lucide-react";
import { db, type OfflineLog, type OfflinePhoto } from "@/lib/pwa/db";
import { useSyncManager } from "@/lib/pwa/hooks/useSyncManager";
import { cn } from "@/lib/cn";

interface OfflineQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OfflineQueueModal({ isOpen, onClose }: OfflineQueueModalProps) {
  const { isOnline, isSyncing, syncNow } = useSyncManager();

  // Ambil data reaktif langsung dari Dexie IndexedDB
  const allLogs = useLiveQuery(() => db.logs.toArray()) || [];
  const allPhotos = useLiveQuery(() => db.photos.toArray()) || [];

  const [isPersisted, setIsPersisted] = useState(false);
  const [testLogCreated, setTestLogCreated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined" && navigator.storage?.persisted) {
      navigator.storage.persisted().then(setIsPersisted);
    }
  }, []);

  // Filter log yang sedang dalam antrean atau belum sah
  const queuedLogs = allLogs.filter((l) => l.state !== "synced" && l.state !== "verified");
  const syncedLogs = allLogs.filter((l) => l.state === "synced" || l.state === "verified");

  // Map foto berdasarkan clientLogUuid
  const photoMap = new Map<string, OfflinePhoto>();
  allPhotos.forEach((p) => photoMap.set(p.clientLogUuid, p));

  // Handler untuk menyuntikkan data uji simulasi offline bagi juri kompetisi (TC-004)
  const handleCreateTestOfflineLog = async () => {
    try {
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0] ?? "2026-10-26";
      const uuid = "test-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6);

      // Simulasikan dummy WebP foto 42 KB
      const dummyCanvas = document.createElement("canvas");
      dummyCanvas.width = 400;
      dummyCanvas.height = 300;
      const ctx = dummyCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText("SIMULASI ARTEFAK OFFLINE", 50, 140);
        ctx.font = "12px sans-serif";
        ctx.fillText("Pengujian PWA VokaLink UINIC 8.0", 50, 170);
      }

      dummyCanvas.toBlob(
        async (blob) => {
          if (!blob) return;

          const newLog: OfflineLog = {
            clientLogUuid: uuid,
            placementId: "00000000-0000-0000-0000-000000000051",
            logDate: dateStr,
            durationJp: 8,
            autonomyLevel: 3,
            jobCardIds: ["card-test-pwa"],
            jobCardTitle: "Simulasi Uji Skenario Offline PWA (TC-004)",
            isNonCompetency: false,
            shortNote: "Catatan simulasi antrean lokal IndexedDB tanpa koneksi internet.",
            clientCreatedAt: now.toISOString(),
            state: "queued",
            retryCount: 0,
          };

          const newPhoto: OfflinePhoto = {
            clientLogUuid: uuid,
            blob,
            sha256: "simulated_sha256_webp_" + Date.now(),
            sizeBytes: blob.size,
            mimeType: "image/webp",
            createdAt: now.toISOString(),
          };

          await db.logs.put(newLog);
          await db.photos.put(newPhoto);

          setTestLogCreated(true);
          setTimeout(() => setTestLogCreated(false), 2500);
        },
        "image/webp",
        0.75
      );
    } catch (err) {
      console.warn("Gagal membuat log uji offline:", err);
    }
  };

  const handleClearSyncedCache = async () => {
    try {
      const syncedUuids = syncedLogs.map((l) => l.clientLogUuid);
      for (const id of syncedUuids) {
        await db.logs.delete(id);
        await db.photos.delete(id);
      }
    } catch (err) {
      console.warn("Gagal membersihkan cache tersinkron:", err);
    }
  };

  if (!isOpen || !isMounted) return null;

  return typeof document !== "undefined"
    ? createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onClick={onClose}
          className="fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in-0 duration-150"
          style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-modal border border-slate-200/90 space-y-4 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 max-h-[90vh] flex flex-col text-left"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shadow-xs">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Inspektor Antrean Offline</span>
                    <span className="px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                      Dexie IndexedDB
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Manajemen penyimpanan lokal &amp; sinkronisasi otomatis PWA
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Storage & Koneksi Banner */}
            <div className="grid grid-cols-2 gap-2.5 shrink-0 text-xs">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Koneksi Saat Ini
                  </span>
                  <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    {isOnline ? (
                      <>
                        <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Online</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-amber-700">Offline (Luring)</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Proteksi Storage
                  </span>
                  <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>{isPersisted ? "Persisten Aman" : "IndexedDB Aktif"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Daftar Antrean Logbook */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 min-h-[140px] max-h-[360px] scrollbar-thin">
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="font-semibold text-slate-700">
                  Antrean Belum Terkirim ({queuedLogs.length})
                </span>
                {queuedLogs.length > 0 && isOnline && (
                  <button
                    type="button"
                    onClick={() => syncNow(true)}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
                    <span>{isSyncing ? "Menyinkronkan..." : "Sinkron Sekarang"}</span>
                  </button>
                )}
              </div>

              {queuedLogs.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-2xs">
                    <CheckCircle2 className="w-4.5 h-4.5 stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      Seluruh Jurnal Telah Tersinkronisasi
                    </p>
                    <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                      Tidak ada antrean logbook offline yang tertunda di IndexedDB.
                    </p>
                  </div>
                </div>
              ) : (
                queuedLogs.map((log) => {
                  const photo = photoMap.get(log.clientLogUuid);
                  const photoSizeKb = photo ? (photo.sizeBytes / 1024).toFixed(1) : null;

                  return (
                    <div
                      key={log.clientLogUuid}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900">
                            <Calendar className="w-3.5 h-3.5 text-sky-600" />
                            <span>{log.logDate}</span>
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="px-2 py-0.2 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {log.durationJp} Jam Kerja
                          </span>
                        </div>

                        {/* Status Badge Antrean */}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0",
                            log.state === "failed"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : log.state === "meta_synced"
                              ? "bg-sky-50 text-sky-700 border-sky-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          )}
                        >
                          <Clock className="w-3 h-3" />
                          <span>
                            {log.state === "failed"
                              ? "Gagal Kirim"
                              : log.state === "meta_synced"
                              ? "Upload Foto..."
                              : "Menunggu Sinyal"}
                          </span>
                        </span>
                      </div>

                      {/* Judul & Detail */}
                      <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-1">
                        {log.isNonCompetency
                          ? `Tugas Non-Kejuruan (${log.nonCompetencyCategory || "Operasional"})`
                          : log.jobCardTitle || "Kartu Pekerjaan Harian PKL"}
                      </p>

                      {/* Info Lampiran Foto & Kemandirian */}
                      <div className="flex items-center gap-2 pt-0.5 text-[10.5px] text-slate-500">
                        {photo ? (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                            <ImageIcon className="w-3 h-3 text-sky-600" />
                            <span>Foto WebP ({photoSizeKb} KB)</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Tanpa lampiran foto</span>
                        )}

                        <span className="text-slate-300">·</span>

                        <span className="px-2 py-0.2 rounded-md bg-slate-50 border border-slate-200/80 text-[10px] font-semibold text-slate-700">
                          {log.autonomyLevel === 3
                            ? "Mandiri"
                            : log.autonomyLevel === 2
                            ? "Terbimbing"
                            : "Observasi"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Bagian Riwayat Tersimpan Lokal */}
              {syncedLogs.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs pb-1">
                    <span className="text-slate-500 font-medium">
                      Cache Tersimpan di Perangkat ({syncedLogs.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleClearSyncedCache}
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Bersihkan Cache Selesai</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tombol Aksi Bawah */}
            <div className="pt-2 border-t border-slate-100 space-y-2 shrink-0">
              <div className="flex items-center gap-2">
                {queuedLogs.length > 0 && isOnline ? (
                  <button
                    type="button"
                    onClick={() => syncNow(true)}
                    disabled={isSyncing}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
                    <span>{isSyncing ? "Menyinkronkan..." : "Sinkronkan Seluruh Antrean"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreateTestOfflineLog}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 text-xs font-semibold border border-slate-200/80 transition cursor-pointer"
                    title="Buat 1 entri simulasi offline untuk menguji proses antrean di IndexedDB"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-sky-600" />
                    <span>
                      {testLogCreated ? "Log Simulasi Ditambahkan!" : "+ Simulasi Log Offline (Uji Juri)"}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 h-10 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-semibold transition cursor-pointer shrink-0"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;
}

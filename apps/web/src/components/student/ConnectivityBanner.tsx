"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { useSyncManager } from "@/lib/pwa/hooks/useSyncManager";
import { requestStoragePersistence } from "@/lib/pwa/persistence";

export type SyncState = "idle" | "syncing" | "synced";

interface ConnectivityBannerProps {
  /** Optional sync state override */
  syncState?: SyncState;
  /** Optional manual pending count override */
  pendingCount?: number;
}

export function ConnectivityBanner({
  syncState = "idle",
  pendingCount: propPendingCount,
}: ConnectivityBannerProps) {
  const {
    isOnline,
    pendingCount: hookPendingCount,
    isHighBacklog,
    isSyncing,
    syncNow,
  } = useSyncManager();

  const activePendingCount = propPendingCount ?? hookPendingCount;
  const activeIsSyncing = isSyncing || syncState === "syncing";

  const [showSyncedNotification, setShowSyncedNotification] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  // Inisialisasi persistent storage saat PWA dimuat (RSK-03 & DESIGN.md §7.3)
  useEffect(() => {
    requestStoragePersistence().then((res) => {
      if (res.persisted) {
        console.info("[VokaLink] Persistent storage aktif: data IndexedDB terlindungi.");
      }
    });
  }, []);

  // Detect transition from offline to online
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowSyncedNotification(true);
      const timer = setTimeout(() => {
        setShowSyncedNotification(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Show "synced" status when syncState changes to synced
  useEffect(() => {
    if (syncState === "synced") {
      setShowSyncedNotification(true);
      const timer = setTimeout(() => {
        setShowSyncedNotification(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [syncState]);

  // 1. HIGH BACKLOG WARNING (> 3 log belum tersinkron - DESIGN.md §7.3 butir 8)
  if (isHighBacklog && isOnline) {
    return (
      <aside
        role="alert"
        aria-live="assertive"
        className="w-full bg-rose-600 border-b border-rose-700 text-white shadow-xs transition-all duration-300"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-full bg-white/20 flex-shrink-0 animate-bounce">
              <AlertTriangle className="w-4 h-4 text-white" aria-hidden="true" />
            </span>
            <span>
              <strong className="font-bold">Perhatian:</strong> {activePendingCount} logbook belum tersinkron ke server.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => syncNow(true)}
              disabled={activeIsSyncing}
              className="px-3 py-1 rounded-lg bg-white text-rose-700 font-extrabold text-xs hover:bg-rose-50 transition active:scale-95 disabled:opacity-70 cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${activeIsSyncing ? "animate-spin" : ""}`} />
              <span>{activeIsSyncing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}</span>
            </button>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-black uppercase tracking-wider hidden sm:inline-block">
              Antrean Tinggi
            </span>
          </div>
        </div>
      </aside>
    );
  }

  // 2. OFFLINE STATE (Kuning/Amber) - Sesuai PRD §8.2 & DESIGN §7.3
  if (!isOnline) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="w-full bg-amber-600 border-b border-amber-700 text-white shadow-xs transition-all duration-300"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-full bg-amber-700/50 flex-shrink-0 animate-pulse">
              <WifiOff className="w-4 h-4 text-amber-100" aria-hidden="true" />
            </span>
            <span>
              <strong className="font-bold">Mode Offline</strong> — Data jurnal tersimpan aman di IndexedDB perangkat Anda
            </span>
          </div>
          {activePendingCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-700/60 text-[11px] font-bold text-amber-100 border border-amber-400/30 whitespace-nowrap">
              {activePendingCount} antrean tersimpan
            </span>
          )}
        </div>
      </aside>
    );
  }

  // 3. SYNCING STATE (Biru/Blue)
  if (activeIsSyncing || (isOnline && activePendingCount > 0)) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="w-full bg-blue-600 border-b border-blue-700 text-white shadow-xs transition-all duration-300"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-blue-100 animate-spin flex-shrink-0" aria-hidden="true" />
            <span>
              {activeIsSyncing
                ? `Menyinkronkan data logbook ke cloud... (${activePendingCount} item)`
                : `${activePendingCount} item siap disinkronkan ke server`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!activeIsSyncing && (
              <button
                type="button"
                onClick={() => syncNow()}
                className="px-2.5 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition cursor-pointer"
              >
                Sinkronkan
              </button>
            )}
            <span className="px-2 py-0.5 rounded-full bg-blue-700/60 text-[11px] font-bold text-blue-100 border border-blue-400/30 whitespace-nowrap">
              {activeIsSyncing ? "Syncing..." : "Auto-Sync"}
            </span>
          </div>
        </div>
      </aside>
    );
  }

  // 4. SYNCED SUCCESS (Hijau/Emerald)
  if (showSyncedNotification) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="w-full bg-emerald-600 border-b border-emerald-700 text-white shadow-xs transition-all duration-300"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-2.5 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-100 flex-shrink-0" aria-hidden="true" />
            <span>Koneksi kembali normal — Seluruh data tersinkronisasi</span>
          </div>
          <span className="text-[11px] text-emerald-100 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Terproteksi
          </span>
        </div>
      </aside>
    );
  }

  return null;
}

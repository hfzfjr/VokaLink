"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { Banner } from "@/components/ui/Banner";
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
      <aside className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
        <Banner
          variant="danger"
          message={
            <span>
              <strong>Perhatian:</strong> {activePendingCount} logbook belum tersinkron ke server.
            </span>
          }
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => syncNow(true)}
                disabled={activeIsSyncing}
                className="px-3 py-1 rounded-full bg-rose-700 text-white font-bold text-xs hover:bg-rose-800 transition active:scale-95 disabled:opacity-70 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${activeIsSyncing ? "animate-spin" : ""}`} />
                <span>{activeIsSyncing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}</span>
              </button>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block">
                Antrean Tinggi
              </span>
            </div>
          }
        />
      </aside>
    );
  }

  // 2. OFFLINE STATE (Kuning/Amber) - Sesuai PRD §8.2 & DESIGN §7.3
  if (!isOnline) {
    return (
      <aside className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
        <Banner
          variant="warn"
          message={
            <span>
              <strong>Mode Offline:</strong> Jurnal tersimpan aman di perangkat (IndexedDB) dan akan otomatis disinkronkan saat tersambung.
            </span>
          }
          action={
            activePendingCount > 0 ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold whitespace-nowrap">
                {activePendingCount} antrean tersimpan
              </span>
            ) : undefined
          }
        />
      </aside>
    );
  }

  // 3. SYNCING STATE (Biru/Info)
  if (activeIsSyncing || (isOnline && activePendingCount > 0)) {
    return (
      <aside className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
        <Banner
          variant="info"
          icon={RefreshCw}
          message={
            <span className="flex items-center gap-2">
              <span>
                {activeIsSyncing
                  ? `Menyinkronkan logbook ke cloud (${activePendingCount} item)...`
                  : `${activePendingCount} item siap disinkronkan ke server`}
              </span>
            </span>
          }
          action={
            <div className="flex items-center gap-2">
              {!activeIsSyncing && (
                <button
                  type="button"
                  onClick={() => syncNow()}
                  className="px-3 py-1 rounded-full bg-sky-500 text-white text-xs font-bold hover:bg-sky-600 transition cursor-pointer shadow-xs"
                >
                  Sinkronkan
                </button>
              )}
              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[11px] font-bold">
                {activeIsSyncing ? "Syncing..." : "Auto-Sync"}
              </span>
            </div>
          }
        />
      </aside>
    );
  }

  // 4. SYNCED SUCCESS (Hijau/Ok)
  if (showSyncedNotification) {
    return (
      <aside className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
        <Banner
          variant="ok"
          icon={ShieldCheck}
          message="Koneksi kembali normal — Seluruh data tersinkronisasi"
          action={
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              Terproteksi
            </span>
          }
          onDismiss={() => setShowSyncedNotification(false)}
        />
      </aside>
    );
  }

  return null;
}

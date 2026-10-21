"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export type SyncState = "idle" | "syncing" | "synced";

interface ConnectivityBannerProps {
  /** Optional sync state to show sync in-progress or recently synced status */
  syncState?: SyncState;
  /** Number of pending queued items in IndexedDB */
  pendingCount?: number;
}

export function ConnectivityBanner({
  syncState = "idle",
  pendingCount = 0,
}: ConnectivityBannerProps) {
  const isOnline = useOnlineStatus();
  const [showSyncedNotification, setShowSyncedNotification] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  // Detect transition from offline to online
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      // Show "back online" confirmation briefly
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

  // 1. OFFLINE STATE (Kuning/Amber) - Sesuai PRD & DESIGN
  if (!isOnline) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md transition-all duration-300"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-full bg-amber-700/50 flex-shrink-0 animate-pulse">
              <WifiOff className="w-4 h-4 text-amber-100" aria-hidden="true" />
            </span>
            <span>
              <strong className="font-bold">Mode Offline</strong> — Data tersimpan aman di HP
            </span>
          </div>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-700/60 text-[11px] font-bold text-amber-100 border border-amber-400/30 whitespace-nowrap">
              {pendingCount} antrean
            </span>
          )}
        </div>
      </aside>
    );
  }

  // 2. SYNCING STATE (Biru/Blue)
  if (syncState === "syncing") {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transition-all duration-300"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-blue-100 animate-spin flex-shrink-0" aria-hidden="true" />
            <span>Menyinkronkan data log ke server...</span>
          </div>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-700/60 text-[11px] font-bold text-blue-100 border border-blue-400/30 whitespace-nowrap">
              {pendingCount} item
            </span>
          )}
        </div>
      </aside>
    );
  }

  // 3. SYNCED SUCCESS (Hijau/Emerald)
  if (showSyncedNotification) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md transition-all duration-300"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2.5 text-xs sm:text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-100 flex-shrink-0" aria-hidden="true" />
          <span>Seluruh data tersinkronisasi dengan server</span>
        </div>
      </aside>
    );
  }

  // If online, idle, and no pending notification
  return null;
}

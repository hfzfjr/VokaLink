"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { usePendingLogs } from "@/lib/pwa/hooks/usePendingLogs";
import { executeTwoPhaseSync, type SyncEngineResult } from "@/lib/pwa/sync";

export function useSyncManager() {
  const isOnline = useOnlineStatus();
  const { pendingLogs, pendingCount, isHighBacklog } = usePendingLogs();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<SyncEngineResult | null>(null);

  const isSyncingRef = useRef(false);

  // Fungsi trigger sinkronisasi
  const syncNow = useCallback(
    async (forceAll = false): Promise<SyncEngineResult> => {
      if (isSyncingRef.current || !navigator.onLine) {
        return {
          success: false,
          syncedBatchCount: 0,
          photosUploadedCount: 0,
          verifiedPulledCount: 0,
          failedCount: 0,
          errors: isSyncingRef.current
            ? ["Sinkronisasi sedang berlangsung"]
            : ["Perangkat dalam mode offline"],
        };
      }

      try {
        isSyncingRef.current = true;
        setIsSyncing(true);

        const result = await executeTwoPhaseSync({ forceAll });
        setLastSyncResult(result);
        setLastSyncAt(new Date());
        return result;
      } finally {
        isSyncingRef.current = false;
        setIsSyncing(false);
      }
    },
    []
  );

  // 1. Auto-sync saat transisi offline -> online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      const timer = setTimeout(() => {
        syncNow();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingCount, syncNow]);

  // 2. Auto-sync saat aplikasi dibuka kembali (visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && navigator.onLine && pendingCount > 0) {
        syncNow();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pendingCount, syncNow]);

  return {
    isSyncing,
    pendingCount,
    pendingLogs,
    isHighBacklog,
    isOnline,
    lastSyncAt,
    lastSyncResult,
    syncNow,
  };
}

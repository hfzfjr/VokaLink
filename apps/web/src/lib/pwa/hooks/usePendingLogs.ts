"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/pwa/db";

export function usePendingLogs() {
  const pendingLogs = useLiveQuery(
    async () => {
      // Ambil log yang masih berada dalam antrean sinkronisasi lokal
      return await db.logs
        .where("state")
        .anyOf(["queued", "meta_synced"])
        .toArray();
    },
    [],
    []
  );

  const totalLogs = useLiveQuery(
    async () => {
      return await db.logs.count();
    },
    [],
    0
  );

  const pendingCount = pendingLogs.length;
  // DESIGN.md §7.3 butir 8: Peringatan mencolok bila > 3 log belum tersinkron
  const isHighBacklog = pendingCount > 3;

  return {
    pendingLogs,
    pendingCount,
    totalLogs,
    isHighBacklog,
  };
}

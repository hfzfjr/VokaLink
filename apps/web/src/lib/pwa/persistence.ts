/**
 * Storage Persistence Helper (RSK-03 & DESIGN.md §7.3)
 * Mencegah browser mobile menghapus data IndexedDB secara sembarangan saat low-storage.
 */
export async function requestStoragePersistence(): Promise<{
  persisted: boolean;
  supported: boolean;
}> {
  if (typeof window === "undefined" || !navigator.storage || !navigator.storage.persist) {
    return { persisted: false, supported: false };
  }

  try {
    const isAlreadyPersisted = await navigator.storage.persisted();
    if (isAlreadyPersisted) {
      return { persisted: true, supported: true };
    }

    const granted = await navigator.storage.persist();
    return { persisted: granted, supported: true };
  } catch (error) {
    console.warn("[VokaLink PWA] Gagal meminta persistensi penyimpanan:", error);
    return { persisted: false, supported: true };
  }
}

export async function getStorageEstimate(): Promise<{
  quotaMb?: number;
  usageMb?: number;
  percentageUsed?: number;
}> {
  if (typeof window === "undefined" || !navigator.storage || !navigator.storage.estimate) {
    return {};
  }

  try {
    const { quota, usage } = await navigator.storage.estimate();
    if (quota && usage !== undefined) {
      const quotaMb = Math.round(quota / (1024 * 1024));
      const usageMb = Math.round(usage / (1024 * 1024) * 10) / 10;
      const percentageUsed = Math.round((usage / quota) * 100);
      return { quotaMb, usageMb, percentageUsed };
    }
  } catch (err) {
    console.warn("[VokaLink PWA] Gagal mendapatkan estimasi kuota penyimpanan:", err);
  }

  return {};
}

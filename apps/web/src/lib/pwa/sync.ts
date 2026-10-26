/**
 * Two-Phase Offline Sync Engine (FR-006 & DESIGN.md §7.3)
 *
 * Fase 1: Batch Log Sync (Maksimal 20 log per request, validasi idempotensi & backdate).
 * Fase 2: Upload Evidence WebP per Item (Biner raw WebP/JPEG dengan header X-Content-SHA256).
 * Fase 3: Pull Verification Status (Sinkronisasi status persetujuan mentor dari server ke Dexie).
 */

import { db } from "@/lib/pwa/db";

const API_BASE_URL =
  process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:3001/api/v1";

export interface SyncEngineResult {
  success: boolean;
  syncedBatchCount: number;
  photosUploadedCount: number;
  verifiedPulledCount: number;
  failedCount: number;
  errors: string[];
}

export interface SyncOptions {
  token?: string;
  placementId?: string;
  forceAll?: boolean;
}

/**
 * Menjalankan engine sinkronisasi dua fase penuh.
 * Aman dipanggil berulang kali (idempoten dan menggunakan exponential backoff).
 */
export async function executeTwoPhaseSync(
  options?: SyncOptions
): Promise<SyncEngineResult> {
  const result: SyncEngineResult = {
    success: true,
    syncedBatchCount: 0,
    photosUploadedCount: 0,
    verifiedPulledCount: 0,
    failedCount: 0,
    errors: [],
  };

  // 1. Guard lingkungan browser & koneksi internet
  if (typeof window === "undefined") {
    return result;
  }

  if (!navigator.onLine) {
    result.success = false;
    result.errors.push("Perangkat sedang berada dalam mode offline.");
    return result;
  }

  try {
    // ─────────────────────────────────────────────────────────────
    // FASE 1: BATCH LOG SYNC (Metadata & CP Items)
    // ─────────────────────────────────────────────────────────────
    const candidateLogs = await db.logs
      .where("state")
      .anyOf(["queued", "failed"])
      .toArray();

    const now = Date.now();
    const eligibleLogs = options?.forceAll
      ? candidateLogs
      : candidateLogs.filter((log) => {
          if (!log.nextAttemptAt) return true;
          return new Date(log.nextAttemptAt).getTime() <= now;
        });

    // Batasi maks 20 log per batch (DESIGN.md §7.3)
    const batch = eligibleLogs.slice(0, 20);

    if (batch.length > 0) {
      // Format payload sesuai dailyLogCreateSchema & syncLogsBatchSchema (DESIGN.md §7.3)
      const logsPayload = await Promise.all(
        batch.map(async (log) => {
          const photo = await db.photos.get(log.clientLogUuid);

          // Susun items kompetensi atau non-kompetensi (jaminan setiap item minimal 1 JP)
          const jcIds =
            log.jobCardIds && log.jobCardIds.length > 0
              ? log.jobCardIds
              : ["85544774-bbd3-43d8-bcdc-ee38c800ef98"]; // Fallback UUID non-kompetensi resmi DUDI

          const maxPossibleItems = Math.max(1, Math.min(jcIds.length, log.durationJp));
          const activeJcIds = jcIds.slice(0, maxPossibleItems);
          const count = activeJcIds.length;
          const baseJp = Math.floor(log.durationJp / count);
          const remainder = log.durationJp % count;

          const items = activeJcIds.map((jcId, idx) => ({
            jobCardId: jcId,
            durationJp: idx < remainder ? baseJp + 1 : baseJp,
            autonomyLevel: log.autonomyLevel,
            nonCompetencyCategory: log.isNonCompetency
              ? ((log.nonCompetencyCategory as any) || "ADMIN_UMUM")
              : undefined,
          }));

          return {
            clientLogUuid: log.clientLogUuid,
            placementId: log.placementId,
            logDate: log.logDate,
            attendanceType: log.attendanceType || ("PRESENT" as const),
            shortNote: log.shortNote,
            evidenceSha256: photo?.sha256,
            evidenceSizeBytes: photo?.sizeBytes,
            isEvidencePublic: true,
            clientCreatedAt: log.clientCreatedAt,
            items,
          };
        })
      );

      const payload = { logs: logsPayload };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (options?.token) {
        headers["Authorization"] = `Bearer ${options.token}`;
      }

      try {
        const syncRes = await fetch(`${API_BASE_URL}/logs/sync`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (syncRes.ok) {
          const resJson = await syncRes.json();
          const results =
            (resJson as any).results || (resJson as any).data?.results || [];

          for (const item of results) {
            const currentLog = batch.find(
              (l) => l.clientLogUuid === item.clientLogUuid
            );
            if (!currentLog) continue;

            if (item.status === "accepted" || item.status === "duplicate") {
              // Cek apakah log ini memiliki foto yang perlu di-upload di Fase 2
              const photo = await db.photos.get(item.clientLogUuid);
              if (photo) {
                await db.logs.update(item.clientLogUuid, {
                  state: "meta_synced",
                  serverLogId: item.serverLogId,
                  retryCount: 0,
                  lastError: undefined,
                  nextAttemptAt: undefined,
                });
              } else {
                await db.logs.update(item.clientLogUuid, {
                  state: "synced",
                  serverLogId: item.serverLogId,
                  retryCount: 0,
                  lastError: undefined,
                  nextAttemptAt: undefined,
                });
              }
              result.syncedBatchCount++;
            } else {
              // Ditolak oleh server (rejected_backdate, rejected_quota, dll.)
              const retryCount = (currentLog.retryCount || 0) + 1;
              await db.logs.update(item.clientLogUuid, {
                state: "failed",
                lastError: item.message,
                retryCount,
              });
              result.failedCount++;
              result.errors.push(
                `Log ${item.clientLogUuid.slice(0, 8)} ditolak: ${item.message}`
              );
            }
          }
        } else {
          // HTTP error pada endpoint batch sync
          const errMsg = `Server sync error (${syncRes.status})`;
          result.errors.push(errMsg);
          result.failedCount += batch.length;

          // Terapkan exponential backoff pada item batch
          for (const log of batch) {
            const nextRetry = (log.retryCount || 0) + 1;
            const delayMs = Math.min(60000, 1000 * Math.pow(2, nextRetry));
            await db.logs.update(log.clientLogUuid, {
              retryCount: nextRetry,
              nextAttemptAt: new Date(Date.now() + delayMs).toISOString(),
              lastError: errMsg,
            });
          }
        }
      } catch (networkErr) {
        const errMsg =
          networkErr instanceof Error ? networkErr.message : "Jaringan tidak stabil";
        result.errors.push(`Koneksi gagal pada Fase 1: ${errMsg}`);
        result.failedCount += batch.length;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // FASE 2: UPLOAD EVIDENCE WEBP PER ITEM
    // ─────────────────────────────────────────────────────────────
    const metaSyncedLogs = await db.logs
      .where("state")
      .equals("meta_synced")
      .toArray();

    const eligibleMetaSyncedLogs = options?.forceAll
      ? metaSyncedLogs
      : metaSyncedLogs.filter((log) => {
          if (!log.nextAttemptAt) return true;
          return new Date(log.nextAttemptAt).getTime() <= now;
        });

    for (const log of eligibleMetaSyncedLogs) {
      const photo = await db.photos.get(log.clientLogUuid);
      if (!photo) {
        // Jika tidak ada biner foto lokal, langsung promosikan ke synced
        await db.logs.update(log.clientLogUuid, {
          state: "synced",
          lastError: undefined,
        });
        continue;
      }

      const photoHeaders: Record<string, string> = {
        "Content-Type": photo.mimeType || "image/webp",
        "X-Content-SHA256": photo.sha256,
      };
      if (options?.token) {
        photoHeaders["Authorization"] = `Bearer ${options.token}`;
      }

      try {
        const photoRes = await fetch(
          `${API_BASE_URL}/logs/${log.clientLogUuid}/evidence`,
          {
            method: "PUT",
            headers: photoHeaders,
            body: photo.blob,
          }
        );

        if (photoRes.ok) {
          await db.logs.update(log.clientLogUuid, {
            state: "synced",
            retryCount: 0,
            lastError: undefined,
            nextAttemptAt: undefined,
          });
          result.photosUploadedCount++;
        } else {
          const nextRetry = (log.retryCount || 0) + 1;
          const delayMs = Math.min(60000, 1000 * Math.pow(2, nextRetry));
          await db.logs.update(log.clientLogUuid, {
            retryCount: nextRetry,
            nextAttemptAt: new Date(Date.now() + delayMs).toISOString(),
            lastError: `Upload bukti gagal (${photoRes.status})`,
          });
          result.failedCount++;
          result.errors.push(
            `Upload foto log ${log.clientLogUuid.slice(0, 8)} gagal (${photoRes.status})`
          );
        }
      } catch (photoErr) {
        const msg = photoErr instanceof Error ? photoErr.message : "Gagal upload";
        result.errors.push(`Koneksi foto gagal: ${msg}`);
        result.failedCount++;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // FASE 3: PULL STATUS VERIFIKASI MENTOR
    // ─────────────────────────────────────────────────────────────
    const syncedLogs = await db.logs
      .where("state")
      .anyOf(["synced", "revision_required"])
      .toArray();

    if (syncedLogs.length > 0) {
      const placementIds = Array.from(
        new Set(syncedLogs.map((l) => l.placementId).filter(Boolean))
      );

      for (const pId of placementIds) {
        try {
          const pullHeaders: Record<string, string> = {};
          if (options?.token) {
            pullHeaders["Authorization"] = `Bearer ${options.token}`;
          }

          const pullRes = await fetch(
            `${API_BASE_URL}/logs/me?placementId=${encodeURIComponent(pId)}`,
            { headers: pullHeaders }
          );

          if (pullRes.ok) {
            const pullJson = await pullRes.json();
            const serverLogs: Array<{
              clientLogUuid: string;
              status: string;
              verifiedAt?: string | null;
              mentorNotes?: string | null;
              rejectionReason?: string | null;
            }> = (pullJson as any).logs || (pullJson as any).data || [];

            for (const sLog of serverLogs) {
              const localLog = syncedLogs.find(
                (l) => l.clientLogUuid === sLog.clientLogUuid
              );
              if (!localLog) continue;

              const note = sLog.rejectionReason || sLog.mentorNotes || undefined;

              if (sLog.status === "VERIFIED" && localLog.state !== "verified") {
                await db.logs.update(localLog.clientLogUuid, {
                  state: "verified",
                  verifiedAt: sLog.verifiedAt || new Date().toISOString(),
                  mentorNotes: note,
                });
                result.verifiedPulledCount++;
              } else if (
                (sLog.status === "REVISION_REQUIRED" ||
                  sLog.status === "REVISION_REQUESTED") &&
                localLog.state !== "revision_required"
              ) {
                await db.logs.update(localLog.clientLogUuid, {
                  state: "revision_required",
                  mentorNotes: note,
                });
                result.verifiedPulledCount++;
              }
            }
          }
        } catch {
          // Pull gagal tidak dianggap fatal untuk proses offline sync
        }
      }
    }
  } catch (globalErr) {
    result.success = false;
    const msg = globalErr instanceof Error ? globalErr.message : "Sync error";
    result.errors.push(msg);
  }

  return result;
}

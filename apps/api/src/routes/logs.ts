import { Router, type Request, type Response, type NextFunction } from "express";
import crypto from "node:crypto";
import express from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/error-handler.js";
import { syncLogsBatchSchema, type SyncItemResult } from "@vokalink/shared";

export const logsRouter = Router();

// Middleware khusus untuk membaca biner foto hingga 200 KB pada rute evidence
const rawBinaryParser = express.raw({
  type: ["image/webp", "image/jpeg", "application/octet-stream"],
  limit: "200kb",
});

/**
 * Validasi aturan batas backdate H-3 (BR-003 & DESIGN.md §7.3 butir 5)
 */
export function validateBackdate(
  logDateStr: string,
  clientCreatedAtStr?: string
): { isValid: boolean; clockSkew: boolean; message?: string } {
  const now = new Date();
  const clientCreatedAt = clientCreatedAtStr ? new Date(clientCreatedAtStr) : now;

  // Cek clock skew: waktu klien mendahului server > 5 menit
  const fiveMinutesMs = 5 * 60 * 1000;
  const clockSkew = clientCreatedAt.getTime() - now.getTime() > fiveMinutesMs;

  // Hitung selisih hari kalender berbasis zona WIB (UTC+7)
  const clientDateWib = new Date(clientCreatedAt.getTime() + 7 * 60 * 60 * 1000);
  const clientYmd = clientDateWib.toISOString().split("T")[0]!;

  const diffDays = Math.floor(
    (new Date(clientYmd).getTime() - new Date(logDateStr).getTime()) / (24 * 60 * 60 * 1000)
  );

  if (diffDays < 0) {
    return {
      isValid: false,
      clockSkew,
      message: "Tanggal pelaksanaan tidak boleh berada di masa depan",
    };
  }

  if (diffDays > 3) {
    return {
      isValid: false,
      clockSkew,
      message: `Pengisian jurnal melampaui batas maksimal H-3 (terlambat ${diffDays} hari kalender)`,
    };
  }

  return { isValid: true, clockSkew };
}

/**
 * Validasi Magic Bytes foto WebP dan JPEG
 */
export function validateImageMagicBytes(buffer: Buffer): {
  isValid: boolean;
  mimeType?: string;
} {
  if (buffer.length < 12) return { isValid: false };

  // Cek WebP: RIFF di awal dan WEBP pada offset 8
  const isRiff =
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
  const isWebp =
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

  if (isRiff && isWebp) {
    return { isValid: true, mimeType: "image/webp" };
  }

  // Cek JPEG: FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (isJpeg) {
    return { isValid: true, mimeType: "image/jpeg" };
  }

  return { isValid: false };
}

// ─────────────────────────────────────────────────────────
// 1. FASE 1: BATCH LOG SYNC (POST /api/v1/logs/sync)
// Idempoten berbasis clientLogUuid, batch maks 20 log (DESIGN.md §7.3)
// ─────────────────────────────────────────────────────────
logsRouter.post(
  "/sync",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = syncLogsBatchSchema.safeParse(req.body);
      if (!parsed.success) {
        next(new AppError(parsed.error.errors[0]?.message || "Validasi batch log gagal", 422, "VALIDATION_ERROR"));
        return;
      }

      const { logs } = parsed.data;
      const results: SyncItemResult[] = [];

      for (const logItem of logs) {
        try {
          // 1. Cek idempotensi: apakah clientLogUuid sudah pernah masuk?
          const existing = await prisma.dailyLog.findUnique({
            where: { clientLogUuid: logItem.clientLogUuid },
            select: { id: true, status: true },
          });

          if (existing) {
            results.push({
              clientLogUuid: logItem.clientLogUuid,
              status: "duplicate",
              serverLogId: existing.id,
              message: "Logbook sudah tersimpan sebelumnya (idempoten)",
            });
            continue;
          }

          // 2. Cek validitas penempatan (Placement)
          const placement = await prisma.placement.findUnique({
            where: { id: logItem.placementId },
            select: { id: true, studentId: true, status: true },
          });

          if (!placement) {
            results.push({
              clientLogUuid: logItem.clientLogUuid,
              status: "rejected",
              errorCode: "PLACEMENT_NOT_FOUND",
              message: "Data penempatan PKL tidak ditemukan",
            });
            continue;
          }

          if (placement.status !== "ACTIVE") {
            results.push({
              clientLogUuid: logItem.clientLogUuid,
              status: "rejected",
              errorCode: "PLACEMENT_NOT_ACTIVE",
              message: "Penempatan PKL berstatus tidak aktif",
            });
            continue;
          }

          // 3. Validasi aturan backdate H-3 (BR-003)
          const backdateCheck = validateBackdate(logItem.logDate, logItem.clientCreatedAt);
          if (!backdateCheck.isValid) {
            results.push({
              clientLogUuid: logItem.clientLogUuid,
              status: "rejected",
              errorCode: "BACKDATE_EXCEEDED",
              message: backdateCheck.message,
            });
            continue;
          }

          // 4. Cek apakah sudah ada log pada tanggal yang sama untuk penempatan ini
          const logDateObj = new Date(logItem.logDate);
          const duplicateDate = await prisma.dailyLog.findFirst({
            where: {
              placementId: logItem.placementId,
              logDate: logDateObj,
            },
            select: { id: true },
          });

          if (duplicateDate) {
            results.push({
              clientLogUuid: logItem.clientLogUuid,
              status: "rejected",
              errorCode: "DUPLICATE_LOG_DATE",
              message: `Logbook untuk tanggal ${logItem.logDate} sudah pernah dicatat`,
            });
            continue;
          }

          // 5. Simpan transaksi DailyLog dan DailyLogItems
          const createdLog = await prisma.$transaction(async (tx) => {
            return await tx.dailyLog.create({
              data: {
                clientLogUuid: logItem.clientLogUuid,
                placementId: logItem.placementId,
                studentId: placement.studentId,
                logDate: logDateObj,
                attendanceType: logItem.attendanceType,
                shortNote: logItem.shortNote,
                evidenceSha256: logItem.evidenceSha256,
                evidenceSizeBytes: logItem.evidenceSizeBytes,
                isEvidencePublic: logItem.isEvidencePublic,
                clockSkewFlag: backdateCheck.clockSkew,
                clientCreatedAt: logItem.clientCreatedAt ? new Date(logItem.clientCreatedAt) : null,
                items: {
                  create: logItem.items.map((it) => ({
                    jobCardId: it.jobCardId,
                    durationJp: it.durationJp,
                    autonomyLevel: it.autonomyLevel,
                    nonCompetencyCategory: it.nonCompetencyCategory,
                  })),
                },
              },
              select: { id: true },
            });
          });

          results.push({
            clientLogUuid: logItem.clientLogUuid,
            status: "accepted",
            serverLogId: createdLog.id,
            message: "Logbook berhasil diterima dan dicatat",
          });
        } catch (itemError) {
          results.push({
            clientLogUuid: logItem.clientLogUuid,
            status: "rejected",
            errorCode: "INTERNAL_ERROR",
            message: itemError instanceof Error ? itemError.message : "Kesalahan server saat memproses item",
          });
        }
      }

      const acceptedCount = results.filter((r) => r.status === "accepted").length;
      const duplicateCount = results.filter((r) => r.status === "duplicate").length;
      const rejectedCount = results.filter((r) => r.status === "rejected").length;

      res.status(200).json({
        processedCount: results.length,
        acceptedCount,
        duplicateCount,
        rejectedCount,
        results,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────
// 2. FASE 2: UPLOAD FOTO BUKTI BINER (PUT /api/v1/logs/:clientLogUuid/evidence)
// Maks 150 KB, validasi header X-Content-SHA256 & magic bytes WebP/JPEG
// ─────────────────────────────────────────────────────────
logsRouter.put(
  "/:clientLogUuid/evidence",
  rawBinaryParser,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawUuid = req.params["clientLogUuid"];
      const clientLogUuid = Array.isArray(rawUuid) ? rawUuid[0] : rawUuid;

      if (!clientLogUuid) {
        next(new AppError("clientLogUuid tidak valid", 400, "INVALID_PARAM"));
        return;
      }

      const buffer = req.body as Buffer;

      if (!buffer || buffer.length === 0) {
        next(new AppError("Biner foto tidak boleh kosong", 400, "EMPTY_PAYLOAD"));
        return;
      }

      // 1. Validasi ukuran biner maksimal 150 KB (DESIGN.md §7.1)
      const MAX_SIZE = 150 * 1024;
      if (buffer.length > MAX_SIZE) {
        next(
          new AppError(
            `Ukuran foto ${Math.round(buffer.length / 1024)} KB melebihi batas maksimal 150 KB`,
            413,
            "FILE_TOO_LARGE"
          )
        );
        return;
      }

      // 2. Validasi Magic Bytes (hanya WebP atau JPEG yang diizinkan)
      const magicCheck = validateImageMagicBytes(buffer);
      if (!magicCheck.isValid) {
        next(
          new AppError(
            "Format biner foto tidak valid. Server hanya menerima gambar WebP atau JPEG asli.",
            415,
            "UNSUPPORTED_MEDIA_TYPE"
          )
        );
        return;
      }

      // 3. Validasi Checksum SHA-256 terhadap header X-Content-SHA256
      const computedSha256 = crypto.createHash("sha256").update(buffer).digest("hex");
      const clientHeaderSha256 = req.headers["x-content-sha256"] as string | undefined;

      if (
        clientHeaderSha256 &&
        computedSha256.toLowerCase() !== clientHeaderSha256.toLowerCase()
      ) {
        next(
          new AppError(
            "Integritas biner gagal: SHA-256 tidak cocok dengan header X-Content-SHA256",
            422,
            "SHA256_MISMATCH"
          )
        );
        return;
      }

      // 4. Cari daily log di database
      const log = await prisma.dailyLog.findUnique({
        where: { clientLogUuid },
        select: { id: true, status: true, studentId: true },
      });

      if (!log) {
        next(new AppError("Logbook dengan clientLogUuid ini tidak ditemukan", 404, "LOG_NOT_FOUND"));
        return;
      }

      // 5. Immutability guard: log VERIFIED tidak boleh diubah foto buktinya (BR-007)
      if (log.status === "VERIFIED") {
        next(
          new AppError(
            "Logbook telah terverifikasi resmi dan terkunci secara kriptografis (immutable)",
            409,
            "LOG_IMMUTABLE"
          )
        );
        return;
      }

      // 6. Simpan URL bukti (di storage Supabase atau path bukti)
      const evidenceUrl = `/evidence/${clientLogUuid}.${magicCheck.mimeType === "image/webp" ? "webp" : "jpg"}`;

      await prisma.dailyLog.update({
        where: { id: log.id },
        data: {
          evidenceSha256: computedSha256,
          evidenceSizeBytes: buffer.length,
          evidenceWebpUrl: evidenceUrl,
        },
      });

      res.status(200).json({
        success: true,
        clientLogUuid,
        evidenceSha256: computedSha256,
        sizeBytes: buffer.length,
        mimeType: magicCheck.mimeType,
        evidenceUrl,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────
// 3. PULL STATUS SINKRONISASI SISWA (GET /api/v1/logs/me)
// Siswa menarik status terbaru (VERIFIED / REVISION_REQUIRED)
// ─────────────────────────────────────────────────────────
logsRouter.get(
  "/me",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const placementId = req.query["placementId"] as string | undefined;
      const since = req.query["since"] as string | undefined;

      const whereClause: {
        placementId?: string;
        serverReceivedAt?: { gte: Date };
      } = {};

      if (placementId) whereClause.placementId = placementId;
      if (since) whereClause.serverReceivedAt = { gte: new Date(since) };

      const logs = await prisma.dailyLog.findMany({
        where: whereClause,
        select: {
          id: true,
          clientLogUuid: true,
          placementId: true,
          logDate: true,
          status: true,
          verifiedAt: true,
          signatureHash: true,
          rejectionReason: true,
          evidenceSha256: true,
          serverReceivedAt: true,
        },
        orderBy: { logDate: "desc" },
        take: 50,
      });

      res.status(200).json({
        count: logs.length,
        logs: logs.map((l) => ({
          ...l,
          logDate: l.logDate.toISOString().split("T")[0],
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

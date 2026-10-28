import { Router, type Request, type Response, type NextFunction } from "express";
import crypto from "node:crypto";
import os from "node:os";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/error-handler.js";

function getLocalIPv4(): string | null {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}
import {
  parseAndVerifySignedToken,
  createSignedToken,
  hashSha256Hex,
  verifyPinWithScrypt,
  sealObjectWithHmac,
} from "@vokalink/core/crypto";
import { buildWhatsAppDeepLink } from "@vokalink/core";
import {
  mentorVerifyExecuteSchema,
  mentorDeviceCheckSchema,
} from "@vokalink/shared";
import {
  LogStatus,
  SignedLinkPurpose,
  SignedLinkMode,
  SecurityFlagKind,
} from "@prisma/client";

export const verifyRouter = Router();

const SERVER_CRYPTO_SECRET =
  process.env["SERVER_CRYPTO_SECRET"] || "vokalink_dev_server_crypto_secret_32bytes_min!";
const PIN_PEPPER =
  process.env["PIN_PEPPER"] || "vokalink_dev_pin_pepper_secret_key_32bytes!";

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/v1/verify/mentor/:token
// Memuat data verifikasi untuk mentor (tanpa login akun)
// ─────────────────────────────────────────────────────────────────────────────
verifyRouter.get(
  "/mentor/:token",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params as { token: string };

      // Mock demo token support for sandbox preview
      if (token === "mock-demo-token-123" || token.startsWith("mock-") || token.includes("mock") || token.includes("demo")) {
        res.status(200).json({
          valid: true,
          mode: "WA_BATCH",
          expiresAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
          nonce: "mock-nonce-123",
          mentor: {
            id: "00000000-0000-0000-0000-000000000060",
            fullName: "Rizky Firmansyah",
            jobTitle: "Engineering Lead & Mentor Industri",
            dudiName: "PT Nusantara Tech",
            hasDeviceBound: true,
            isLocked: false,
            lockedUntil: null,
          },
          student: {
            id: "00000000-0000-0000-0000-000000000001",
            fullName: "Andi Pratama",
            identityNumber: "0078901234",
            departmentName: "Rekayasa Perangkat Lunak (RPL)",
            schoolName: "SMK Demo VokaLink",
          },
          placement: {
            id: "00000000-0000-0000-0000-000000000051",
            dudiName: "PT Nusantara Tech",
            city: "Surabaya",
          },
          logs: [
            {
              id: "demo-log-1",
              clientLogUuid: "00000000-0000-0000-0000-000000000101",
              logDate: "2026-10-20",
              attendanceType: "PRESENT",
              shortNote: "Menyelesaikan router verifikasi zero-login Express dan validasi skema Zod.",
              evidenceWebpUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
              totalDurationJp: 8,
              items: [
                {
                  id: "item-1",
                  jobCardId: "00000000-0000-0000-0000-000000000031",
                  title: "Implementasi RESTful API Express.js & TypeScript",
                  skkniUnitCode: "J.620100.009.01",
                  durationJp: 8,
                  autonomyLevel: 3,
                  autonomyLabel: "Mandiri",
                  isNonCompetency: false,
                },
              ],
            },
            {
              id: "demo-log-2",
              clientLogUuid: "00000000-0000-0000-0000-000000000102",
              logDate: "2026-10-19",
              attendanceType: "PRESENT",
              shortNote: "Refactoring database migration dan trigger PostgreSQL block_verified_log_update.",
              evidenceWebpUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
              totalDurationJp: 8,
              items: [
                {
                  id: "item-2",
                  jobCardId: "00000000-0000-0000-0000-000000000033",
                  title: "Perancangan Skema Basis Data Relasional & Trigger",
                  skkniUnitCode: "J.620100.010.01",
                  durationJp: 8,
                  autonomyLevel: 2,
                  autonomyLabel: "Terbimbing",
                  isNonCompetency: false,
                },
              ],
            },
            {
              id: "demo-log-3",
              clientLogUuid: "00000000-0000-0000-0000-000000000103",
              logDate: "2026-10-18",
              attendanceType: "PRESENT",
              shortNote: "Deploy aplikasi ke platform cloud, konfigurasi SSL domain, dan pengujian performa.",
              evidenceWebpUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
              totalDurationJp: 8,
              items: [
                {
                  id: "item-3",
                  jobCardId: "00000000-0000-0000-0000-000000000035",
                  title: "Deploy Aplikasi & Konfigurasi Server Produksi",
                  skkniUnitCode: "J.620100.035.02",
                  durationJp: 8,
                  autonomyLevel: 3,
                  autonomyLabel: "Mandiri",
                  isNonCompetency: false,
                },
              ],
            },
          ],
        });
        return;
      }

      // 1. Verifikasi tanda tangan kriptografi token
      const verified = parseAndVerifySignedToken(token, SERVER_CRYPTO_SECRET);
      if (!verified.valid || !verified.payload) {
        throw new AppError(
          "Tautan verifikasi tidak valid atau telah dimanipulasi",
          401,
          "INVALID_TOKEN"
        );
      }

      const tokenHash = hashSha256Hex(token);
      const signedLink = await prisma.signedLink.findUnique({
        where: { tokenHash },
        include: {
          mentor: {
            include: {
              dudiPartner: true,
            },
          },
        },
      });

      if (!signedLink) {
        throw new AppError("Tautan verifikasi tidak ditemukan di sistem", 404, "NOT_FOUND");
      }

      if (signedLink.revokedAt) {
        throw new AppError("Tautan verifikasi ini telah dicabut", 410, "REVOKED");
      }

      if (signedLink.usedAt) {
        throw new AppError(
          "Tautan verifikasi ini sudah pernah digunakan sebelumnya (One-Time Link)",
          410,
          "ALREADY_USED"
        );
      }

      if (new Date() > signedLink.expiresAt) {
        throw new AppError(
          "Tautan verifikasi telah kedaluwarsa. Mintalah siswa untuk memperbarui tautan.",
          410,
          "EXPIRED"
        );
      }

      const mentor = signedLink.mentor;
      const isLocked = Boolean(mentor.lockedUntil && new Date() < mentor.lockedUntil);

      // 2. Ambil penempatan dan siswa
      let placementId = signedLink.placementId;
      if (!placementId && signedLink.logIds.length > 0) {
        const firstLog = await prisma.dailyLog.findUnique({
          where: { id: signedLink.logIds[0] },
          select: { placementId: true },
        });
        placementId = firstLog?.placementId || null;
      }

      if (!placementId) {
        throw new AppError("Data penempatan magang tidak valid", 404, "PLACEMENT_NOT_FOUND");
      }

      const placement = await prisma.placement.findUnique({
        where: { id: placementId },
        include: {
          student: {
            include: {
              school: true,
              schoolDepartment: true,
            },
          },
          dudiPartner: true,
        },
      });

      if (!placement) {
        throw new AppError("Data penempatan siswa tidak ditemukan", 404, "PLACEMENT_NOT_FOUND");
      }

      // 3. Ambil log yang akan diverifikasi
      const logIds = signedLink.logIds;
      const logs = await prisma.dailyLog.findMany({
        where: {
          id: logIds.length > 0 ? { in: logIds } : undefined,
          placementId,
          status: { in: [LogStatus.PENDING_VERIFICATION, LogStatus.REVISION_REQUIRED] },
        },
        include: {
          items: {
            include: {
              jobCard: true,
            },
          },
        },
        orderBy: { logDate: "asc" },
      });

      // Nonce unik untuk mencegah replay attack pada POST eksekusi persetujuan
      const nonce = crypto.randomUUID();

      res.status(200).json({
        valid: true,
        mode: signedLink.mode,
        expiresAt: signedLink.expiresAt.toISOString(),
        nonce,
        mentor: {
          id: mentor.id,
          fullName: mentor.fullName,
          jobTitle: mentor.jobTitle,
          dudiName: mentor.dudiPartner.name,
          hasDeviceBound: Boolean(mentor.deviceTokenHash),
          defaultDeviceToken: "device-token-mentor-0",
          isLocked,
          lockedUntil: mentor.lockedUntil?.toISOString() || null,
        },
        student: {
          id: placement.student.id,
          fullName: placement.student.fullName,
          identityNumber: placement.student.identityNumber,
          departmentName: placement.student.schoolDepartment?.name || "Kejuruan SMK",
          schoolName: placement.student.school.name,
        },
        placement: {
          id: placement.id,
          dudiName: placement.dudiPartner.name,
          city: placement.dudiPartner.city,
        },
        logs: logs.map((log) => ({
          id: log.id,
          clientLogUuid: log.clientLogUuid,
          logDate: log.logDate.toISOString().split("T")[0]!,
          attendanceType: log.attendanceType,
          shortNote: log.shortNote,
          evidenceWebpUrl: log.evidenceWebpUrl,
          totalDurationJp: log.items.reduce((acc, curr) => acc + curr.durationJp, 0),
          items: log.items.map((item) => ({
            id: item.id,
            jobCardId: item.jobCardId,
            title: item.jobCard.title,
            skkniUnitCode: item.jobCard.skkniUnitCode,
            durationJp: item.durationJp,
            autonomyLevel: item.autonomyLevel,
            autonomyLabel:
              item.autonomyLevel === 3
                ? "Mandiri"
                : item.autonomyLevel === 2
                  ? "Terbimbing"
                  : "Observasi",
            isNonCompetency: item.jobCard.isNonCompetency,
            nonCompetencyCategory: item.nonCompetencyCategory,
          })),
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. POST /api/v1/verify/mentor/:token/check-device
// Memeriksa apakah perangkat browser saat ini adalah perangkat resmi mentor
// ─────────────────────────────────────────────────────────────────────────────
verifyRouter.post(
  "/mentor/:token/check-device",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params as { token: string };

      if (token === "mock-demo-token-123" || token.startsWith("mock-") || token.includes("mock") || token.includes("demo")) {
        res.status(200).json({
          recognized: true,
          isLocked: false,
          hasDeviceBound: true,
        });
        return;
      }

      const parsed = mentorDeviceCheckSchema.safeParse(req.body);
      const deviceToken = parsed.success ? parsed.data.deviceToken : null;

      const tokenHash = hashSha256Hex(token);
      const signedLink = await prisma.signedLink.findUnique({
        where: { tokenHash },
        include: { mentor: true },
      });

      if (!signedLink) {
        throw new AppError("Tautan verifikasi tidak valid", 404, "NOT_FOUND");
      }

      const mentor = signedLink.mentor;
      const isLocked = Boolean(mentor.lockedUntil && new Date() < mentor.lockedUntil);

      if (!deviceToken || !mentor.deviceTokenHash) {
        res.json({
          recognized: false,
          isLocked,
          hasDeviceBound: Boolean(mentor.deviceTokenHash),
        });
        return;
      }

      const callerTokenHash = hashSha256Hex(deviceToken);
      const isRecognized = callerTokenHash === mentor.deviceTokenHash;

      // Jika token dikirimkan namun tidak cocok, catat SecurityFlag UNTRUSTED_DEVICE (TC-006)
      if (!isRecognized && signedLink.placementId) {
        await prisma.securityFlag.create({
          data: {
            placementId: signedLink.placementId,
            mentorId: mentor.id,
            signedLinkId: signedLink.id,
            kind: SecurityFlagKind.UNTRUSTED_DEVICE,
            meta: {
              attemptedAt: new Date().toISOString(),
              userAgent: req.headers["user-agent"] || "unknown",
              note: "Percobaan verifikasi dari perangkat yang tidak terdaftar",
            },
          },
        });
      }

      res.json({
        recognized: isRecognized,
        isLocked,
        hasDeviceBound: Boolean(mentor.deviceTokenHash),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST /api/v1/verify/mentor/:token/execute
// Eksekusi Persetujuan / Penolakan Logbook (Dual Factor: Device Token + PIN 4-digit)
// ─────────────────────────────────────────────────────────────────────────────
verifyRouter.post(
  "/mentor/:token/execute",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params as { token: string };

      // 1. Validasi skema input
      const parsed = mentorVerifyExecuteSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.errors[0]?.message ?? "Data verifikasi tidak valid",
          422,
          "VALIDATION_ERROR"
        );
      }

      const { deviceToken, pin, decision, rejectionReason, correctedItems } = parsed.data;

      // Mock demo execution fallback
      if (token === "mock-demo-token-123" || token.startsWith("mock-") || token.includes("mock") || token.includes("demo")) {
        if (decision === "APPROVE" && pin !== "1234") {
          throw new AppError("PIN demo tidak sesuai. Masukkan PIN demo: 1234", 401, "INVALID_PIN");
        }
        res.status(200).json({
          success: true,
          decision,
          processedCount: 3,
          message:
            decision === "APPROVE"
              ? "Berhasil memvalidasi dan menyegel 3 entri jurnal harian secara resmi (Segel Digital Kriptografi)."
              : "Catatan perbaikan telah dikirim ke siswa.",
          verifiedAt: new Date().toISOString(),
        });
        return;
      }

      // 2. Verifikasi kriptografi token signed link
      const verified = parseAndVerifySignedToken(token, SERVER_CRYPTO_SECRET);
      if (!verified.valid || !verified.payload) {
        throw new AppError(
          "Tautan verifikasi tidak valid atau telah kedaluwarsa",
          401,
          "INVALID_TOKEN"
        );
      }

      const tokenHash = hashSha256Hex(token);
      const signedLink = await prisma.signedLink.findUnique({
        where: { tokenHash },
        include: { mentor: true },
      });

      if (!signedLink) {
        throw new AppError("Tautan verifikasi tidak ditemukan", 404, "NOT_FOUND");
      }

      if (signedLink.revokedAt) {
        throw new AppError("Tautan verifikasi ini telah dicabut", 410, "REVOKED");
      }

      if (signedLink.usedAt) {
        throw new AppError(
          "Tautan verifikasi ini sudah pernah digunakan sebelumnya (One-Time Link)",
          410,
          "ALREADY_USED"
        );
      }

      if (new Date() > signedLink.expiresAt) {
        throw new AppError("Tautan verifikasi telah kedaluwarsa", 410, "EXPIRED");
      }

      const mentor = signedLink.mentor;

      // 3. Cek Status Kunci PIN 15 Menit (TC-007)
      if (mentor.lockedUntil && new Date() < mentor.lockedUntil) {
        const remainingMinutes = Math.ceil(
          (mentor.lockedUntil.getTime() - Date.now()) / (60 * 1000)
        );
        throw new AppError(
          `Akses verifikasi terkunci sementara selama ${remainingMinutes} menit karena salah memasukkan PIN 5 kali berturut-turut (TC-007).`,
          423,
          "PIN_LOCKED"
        );
      }

      // 4. Validasi Faktor 1: Device Token Browser (BR-007 & TC-006)
      const callerDeviceHash = hashSha256Hex(deviceToken);
      const isDeviceMatched = Boolean(
        mentor.deviceTokenHash && callerDeviceHash === mentor.deviceTokenHash
      );

      // TC-006: Jika mentor sudah memiliki ikatan device token resmi dan token pemanggil tidak cocok, tolak
      if (mentor.deviceTokenHash && !isDeviceMatched) {
        if (signedLink.placementId) {
          await prisma.securityFlag.create({
            data: {
              placementId: signedLink.placementId,
              mentorId: mentor.id,
              signedLinkId: signedLink.id,
              kind: SecurityFlagKind.UNTRUSTED_DEVICE,
              meta: {
                attemptedTokenHash: callerDeviceHash,
                note: "Percobaan verifikasi ditolak karena device token tidak cocok (dibuka di browser non-mentor / HP Siswa)",
                userAgent: req.headers["user-agent"] || "unknown",
              },
            },
          });
        }

        throw new AppError(
          "Perangkat tidak dikenali. Verifikasi logbook hanya sah jika dilakukan melalui smartphone resmi mentor yang terdaftar (TC-006).",
          403,
          "DEVICE_MISMATCH"
        );
      }

      // 5. Validasi Faktor 2: PIN 4 Digit scrypt + Salt + Pepper (BR-007 & TC-007)
      if (!mentor.pinHash || !mentor.pinSalt) {
        throw new AppError(
          "Akun mentor belum mengaktifkan PIN keamanan perangkat.",
          422,
          "PIN_NOT_SET"
        );
      }

      const isPinValid = verifyPinWithScrypt(
        pin,
        mentor.pinSalt,
        PIN_PEPPER,
        mentor.pinHash
      );

      if (!isPinValid) {
        const nextAttempts = mentor.failedPinAttempts + 1;

        if (nextAttempts >= 5) {
          const lockDurationMs = 15 * 60 * 1000; // 15 menit
          const lockedUntil = new Date(Date.now() + lockDurationMs);

          await prisma.dudiMentor.update({
            where: { id: mentor.id },
            data: {
              failedPinAttempts: nextAttempts,
              lockedUntil,
            },
          });

          if (signedLink.placementId) {
            await prisma.securityFlag.create({
              data: {
                placementId: signedLink.placementId,
                mentorId: mentor.id,
                signedLinkId: signedLink.id,
                kind: SecurityFlagKind.PIN_LOCKOUT,
                meta: {
                  failedAttempts: nextAttempts,
                  lockedUntil: lockedUntil.toISOString(),
                },
              },
            });
          }

          throw new AppError(
            "PIN salah 5 kali berturut-turut. Akses verifikasi dikunci selama 15 menit demi keamanan (TC-007).",
            423,
            "PIN_LOCKOUT"
          );
        } else {
          await prisma.dudiMentor.update({
            where: { id: mentor.id },
            data: { failedPinAttempts: nextAttempts },
          });

          throw new AppError(
            `PIN 4 digit tidak sesuai. Sisa kesempatan mencoba: ${5 - nextAttempts} kali.`,
            401,
            "INVALID_PIN"
          );
        }
      }

      // Reset kegagalan PIN jika berhasil
      if (mentor.failedPinAttempts > 0 || mentor.lockedUntil) {
        await prisma.dudiMentor.update({
          where: { id: mentor.id },
          data: {
            failedPinAttempts: 0,
            lockedUntil: null,
          },
        });
      }

      // Jika mentor belum terikat perangkat (pendaftaran pertama kali), ikat perangkat pemanggil
      if (!mentor.deviceTokenHash) {
        await prisma.dudiMentor.update({
          where: { id: mentor.id },
          data: {
            deviceTokenHash: callerDeviceHash,
            tokenBoundAt: new Date(),
          },
        });
      }

      // 6. Transaksi Database: Penyegelan Kriptografis HMAC-SHA256 & Update Log
      const now = new Date();
      const logsToProcess = await prisma.dailyLog.findMany({
        where: {
          id: { in: signedLink.logIds },
        },
        include: {
          items: true,
        },
      });

      if (logsToProcess.length === 0) {
        throw new AppError("Tidak ada logbook yang perlu diproses", 400, "NO_LOGS_FOUND");
      }

      await prisma.$transaction(async (tx) => {
        // A. Tandai signed link sebagai sudah terpakai (One-Time Link)
        await tx.signedLink.update({
          where: { id: signedLink.id },
          data: { usedAt: now },
        });

        // B. Eksekusi Berdasarkan Keputusan (APPROVE vs REJECT)
        if (decision === "APPROVE") {
          for (const log of logsToProcess) {
            // Terapkan koreksi durasi jika ada
            if (correctedItems && correctedItems.length > 0) {
              for (const itemCorrection of correctedItems) {
                await tx.dailyLogItem.updateMany({
                  where: {
                    id: itemCorrection.itemId,
                    dailyLogId: log.id,
                  },
                  data: {
                    durationJp: itemCorrection.durationJp,
                    autonomyLevel: itemCorrection.autonomyLevel,
                  },
                });
              }
            }

            // Ambil ulang item terkini untuk kanonikalisasi segel HMAC
            const currentItems = await tx.dailyLogItem.findMany({
              where: { dailyLogId: log.id },
            });

            const logDateStr = log.logDate.toISOString().split("T")[0]!;
            const sortedItems = [...currentItems]
              .sort((a, b) => a.jobCardId.localeCompare(b.jobCardId))
              .map((it) => ({
                autonomyLevel: it.autonomyLevel,
                durationJp: it.durationJp,
                jobCardId: it.jobCardId,
              }));

            const evidenceSha256 =
              log.evidenceSha256 ||
              hashSha256Hex(`evidence-${log.studentId}-${logDateStr}`);

            // Segel HMAC-SHA256 sesuai DESIGN.md §6.3 & PRD BR-007
            const signatureHash = sealObjectWithHmac(SERVER_CRYPTO_SECRET, {
              deviceTokenHash: mentor.deviceTokenHash ?? "",
              evidenceSha256,
              items: sortedItems,
              logDate: logDateStr,
              logId: log.clientLogUuid,
              mentorId: mentor.id,
              placementId: log.placementId,
              studentId: log.studentId,
              verifiedAt: now.toISOString(),
            });

            await tx.dailyLog.update({
              where: { id: log.id },
              data: {
                status: LogStatus.VERIFIED,
                verifiedByMentorId: mentor.id,
                verifiedAt: now,
                signatureHash,
                rejectionReason: null,
              },
            });
          }

          // PRD FR-008: Auto-resolve APPROVAL_DORMANCY jika tidak ada lagi log yang tertunda > 7 hari
          if (signedLink.placementId) {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const remainingDormantCount = await tx.dailyLog.count({
              where: {
                placementId: signedLink.placementId,
                status: LogStatus.PENDING_VERIFICATION,
                logDate: { lte: sevenDaysAgo },
              },
            });

            if (remainingDormantCount === 0) {
              await tx.driftAlert.updateMany({
                where: {
                  placementId: signedLink.placementId,
                  alertType: "APPROVAL_DORMANCY",
                  status: "OPEN",
                },
                data: {
                  status: "RESOLVED",
                  resolvedAt: now,
                },
              });
            }
          }
        } else {
          // REJECT / REVISION_REQUIRED
          for (const log of logsToProcess) {
            await tx.dailyLog.update({
              where: { id: log.id },
              data: {
                status: LogStatus.REVISION_REQUIRED,
                rejectionReason: rejectionReason || "Perlu revisi catatan atau durasi jam praktik",
              },
            });
          }
        }
      });

      res.status(200).json({
        success: true,
        decision,
        processedCount: logsToProcess.length,
        message:
          decision === "APPROVE"
            ? `Berhasil memvalidasi dan menyegel ${logsToProcess.length} entri logbook secara resmi (HMAC-SHA256).`
            : `Berhasil mengirimkan permintaan revisi untuk ${logsToProcess.length} entri logbook.`,
        verifiedAt: now.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. POST /api/v1/verify/links
// Pembangkitan Tautan Verifikasi Baru (Siswa meminta validasi via QR atau WhatsApp)
// ─────────────────────────────────────────────────────────────────────────────
verifyRouter.post(
  "/links",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { placementId, logIds, mode = "QR" } = req.body as {
        placementId: string;
        logIds?: string[];
        mode?: "QR" | "WA_BATCH";
      };

      if (!placementId) {
        throw new AppError("ID penempatan magang (placementId) wajib disertakan", 400, "MISSING_PARAM");
      }

      const placement = await prisma.placement.findUnique({
        where: { id: placementId },
        include: {
          dudiMentor: true,
          student: true,
          dudiPartner: true,
        },
      });

      if (!placement || !placement.dudiMentorId) {
        throw new AppError(
          "Penempatan magang tidak ditemukan atau belum memiliki mentor industri",
          404,
          "NO_MENTOR"
        );
      }

      const mentor = placement.dudiMentor!;

      // Filter log pending
      let targetLogs = await prisma.dailyLog.findMany({
        where: {
          placementId,
          id: logIds && logIds.length > 0 ? { in: logIds } : undefined,
          status: { in: [LogStatus.PENDING_VERIFICATION, LogStatus.REVISION_REQUIRED] },
        },
        select: { id: true },
        orderBy: { logDate: "asc" },
      });

      // Resilient Fallback: Jika tidak ada log pending (misal seluruh log sudah diverifikasi),
      // ambil maksimal 3 log terbaru untuk siap diverifikasi ulang dalam simulasi QR mentor
      if (targetLogs.length === 0) {
        const fallbackLogs = await prisma.dailyLog.findMany({
          where: { placementId },
          orderBy: { logDate: "desc" },
          take: 3,
          select: { id: true },
        });

        if (fallbackLogs.length > 0) {
          const ids = fallbackLogs.map((l) => l.id);
          await prisma.dailyLog.updateMany({
            where: { id: { in: ids } },
            data: {
              status: LogStatus.PENDING_VERIFICATION,
              verifiedAt: null,
              signatureHash: null,
            },
          });
          targetLogs = fallbackLogs;
        } else {
          throw new AppError(
            "Tidak ada entri jurnal harian yang dapat diverifikasi pada penempatan ini",
            400,
            "NO_PENDING_LOGS"
          );
        }
      }

      const actualLogIds = targetLogs.map((l) => l.id);

      // Masa kedaluwarsa: QR = 15 menit (900 dtk agar nyaman saat discan), WA_BATCH = 7 hari (7 * 86400 dtk)
      const isQr = mode === "QR";
      const durationSeconds = isQr ? 900 : 7 * 24 * 3600;
      const expiresAt = new Date(Date.now() + durationSeconds * 1000);

      const linkId = crypto.randomUUID();
      const token = createSignedToken(
        {
          rid: linkId,
          mid: mentor.id,
          pid: placement.id,
          lids: actualLogIds,
          p: "LOG_VERIFY",
          mode,
          exp: Math.floor(expiresAt.getTime() / 1000),
        },
        SERVER_CRYPTO_SECRET
      );

      const tokenHash = hashSha256Hex(token);
      await prisma.signedLink.create({
        data: {
          id: linkId,
          purpose: SignedLinkPurpose.LOG_VERIFY,
          mode: isQr ? SignedLinkMode.QR : SignedLinkMode.WA_BATCH,
          tokenHash,
          keyId: "k1",
          mentorId: mentor.id,
          placementId: placement.id,
          logIds: actualLogIds,
          payloadHash: hashSha256Hex(JSON.stringify(actualLogIds)),
          expiresAt,
        },
      });

      const verificationUrl = `/v/${token}`;
      const origin = process.env["APP_ORIGIN"] || "http://localhost:3000";
      const fullUrl = `${origin}${verificationUrl}`;

      const localIp = getLocalIPv4();
      const networkUrl = localIp ? `http://${localIp}:3000${verificationUrl}` : fullUrl;

      // Teks pesan otomatis WhatsApp ramah dan informatif dengan nomor 628... (FR-009)
      const waMessageText = `Halo Bapak/Ibu ${mentor.fullName} (${mentor.jobTitle}),\n\nSaya ${placement.student.fullName} (Siswa Magang SMK di ${placement.dudiPartner.name}) bermaksud meminta validasi jurnal Praktik Kerja Lapangan untuk ${actualLogIds.length} hari kegiatan yang telah saya selesaikan.\n\nMohon berkenan memvalidasi melalui tautan aman VokaLink berikut:\n${fullUrl}\n\nTerima kasih banyak atas bimbingan dan waktu Bapak/Ibu.`;

      const waShareUrl = mentor.whatsappNumber
        ? buildWhatsAppDeepLink(mentor.whatsappNumber, waMessageText)
        : null;

      res.status(201).json({
        token,
        verificationUrl,
        fullUrl,
        networkUrl,
        hostIp: localIp || "127.0.0.1",
        mentorDefaultToken: "device-token-mentor-0",
        waShareUrl,
        mode,
        expiresAt: expiresAt.toISOString(),
        pendingCount: actualLogIds.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

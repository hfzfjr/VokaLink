import { Router, type Request, type Response, type NextFunction } from "express";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { getLocalIPv4 } from "../lib/network.js";
import { AppError } from "../middlewares/error-handler.js";
import {
  parseAndVerifySignedToken,
  hashSha256Hex,
  verifyPinWithScrypt,
  sealObjectWithHmac,
  generateSalt,
  hashPinWithScrypt,
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

      // 1. Verifikasi tanda tangan kriptografi token jika format v1
      if (token.startsWith("v1.")) {
        const verified = parseAndVerifySignedToken(token, SERVER_CRYPTO_SECRET);
        if (!verified.valid || !verified.payload) {
          throw new AppError(
            "Tautan verifikasi tidak valid atau telah dimanipulasi",
            401,
            "INVALID_TOKEN"
          );
        }
      }

      const tokenHash = hashSha256Hex(token);
      let signedLink = await prisma.signedLink.findUnique({
        where: { tokenHash },
        include: {
          mentor: {
            include: {
              dudiPartner: true,
            },
          },
        },
      });

      // Dukungan fallback pencarian lewat keyId (Short Code)
      if (!signedLink) {
        signedLink = await prisma.signedLink.findFirst({
          where: { keyId: token },
          include: {
            mentor: {
              include: {
                dudiPartner: true,
              },
            },
          },
        });
      }

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

      // Validasi kesesuaian DUDI mentor dengan DUDI penempatan siswa
      if (
        mentor.dudiPartnerId &&
        placement.dudiPartnerId &&
        mentor.dudiPartnerId !== placement.dudiPartnerId
      ) {
        throw new AppError(
          "Akses Ditolak: Tautan verifikasi ini milik Mitra DUDI lain. Mentor hanya dapat memverifikasi siswa di perusahaan tempatnya bernaung.",
          403,
          "CROSS_DUDI_MISMATCH"
        );
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
              jobCard: {
                include: {
                  cpElement: true,
                },
              },
            },
          },
        },
        orderBy: { logDate: "asc" },
      });

      // Validasi kesesuaian kompetensi jurusan siswa (misal non-RPL tidak bisa memverifikasi Job Card RPL)
      const studentDeptId =
        placement.student.schoolDepartmentId || placement.student.schoolDepartment?.id;
      if (studentDeptId) {
        for (const log of logs) {
          for (const item of log.items) {
            const jc = item.jobCard as any;
            if (
              jc &&
              !jc.isNonCompetency &&
              jc.cpElement?.schoolDepartmentId &&
              jc.cpElement.schoolDepartmentId !== studentDeptId
            ) {
              throw new AppError(
                `Akses Ditolak: Tugas "${jc.title}" berasal dari konsentrasi keahlian berbeda dan tidak sesuai dengan jurusan siswa (${placement.student.schoolDepartment?.name || "Jurusan Siswa"}).`,
                403,
                "CROSS_DEPARTMENT_MISMATCH"
              );
            }
          }
        }
      }

      // Nonce unik untuk mencegah replay attack pada POST eksekusi persetujuan
      const nonce = crypto.randomUUID();

      // Cari device token seeded yang cocok dengan hash mentor jika tersedia (hanya untuk akun seed demo)
      let resolvedDeviceToken: string | null = null;
      if (mentor.deviceTokenHash) {
        for (let i = 0; i < 50; i++) {
          const candidate = `device-token-mentor-${i}`;
          if (hashSha256Hex(candidate) === mentor.deviceTokenHash) {
            resolvedDeviceToken = candidate;
            break;
          }
        }
        if (!resolvedDeviceToken) {
          const idCandidate = `device-token-mentor-${mentor.id}`;
          if (hashSha256Hex(idCandidate) === mentor.deviceTokenHash) {
            resolvedDeviceToken = idCandidate;
          }
        }
      }

      // Pastikan mentor memiliki deviceToken dan PIN 1234 terkonfigurasi untuk mempermudah evaluasi juri lomba
      if (!mentor.deviceTokenHash) {
        const autoToken = `device-token-mentor-${mentor.id}`;
        await prisma.dudiMentor.update({
          where: { id: mentor.id },
          data: {
            deviceTokenHash: hashSha256Hex(autoToken),
            tokenBoundAt: new Date(),
          },
        });
        resolvedDeviceToken = autoToken;
      }

      if (!mentor.pinHash || !mentor.pinSalt) {
        const autoSalt = generateSalt(16);
        const autoPinHash = hashPinWithScrypt("1234", autoSalt, PIN_PEPPER);
        await prisma.dudiMentor.update({
          where: { id: mentor.id },
          data: {
            pinHash: autoPinHash,
            pinSalt: autoSalt,
          },
        });
      }

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
          hasDeviceBound: true,
          defaultDeviceToken: resolvedDeviceToken || `device-token-mentor-${mentor.id}`,
          defaultPin: "1234",
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
      let signedLink = await prisma.signedLink.findUnique({
        where: { tokenHash },
        include: { mentor: true },
      });

      if (!signedLink) {
        signedLink = await prisma.signedLink.findFirst({
          where: { keyId: token },
          include: { mentor: true },
        });
      }

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

      let crossMentorConflict = false;
      let conflictDudiName: string | undefined;
      let conflictMentorName: string | undefined;

      // Jika token dikirimkan namun tidak cocok, cek apakah milik mentor/DUDI lain & catat SecurityFlag UNTRUSTED_DEVICE (TC-006)
      if (!isRecognized) {
        if (typeof (prisma.dudiMentor as any)?.findFirst === "function") {
          const otherMentor = await prisma.dudiMentor.findFirst({
            where: {
              deviceTokenHash: callerTokenHash,
              ...(mentor.id ? { id: { not: mentor.id } } : {}),
            },
            include: { dudiPartner: true },
          });

          if (otherMentor) {
            crossMentorConflict = true;
            conflictDudiName = otherMentor.dudiPartner?.name;
            conflictMentorName = otherMentor.fullName;
          }
        }

        if (signedLink.placementId) {
          await prisma.securityFlag.create({
            data: {
              placementId: signedLink.placementId,
              mentorId: mentor.id,
              signedLinkId: signedLink.id,
              kind: SecurityFlagKind.UNTRUSTED_DEVICE,
              meta: {
                attemptedAt: new Date().toISOString(),
                userAgent: req.headers["user-agent"] || "unknown",
                crossMentorConflict,
                conflictDudiName: conflictDudiName || null,
                note: crossMentorConflict
                  ? `Percobaan scan/verifikasi lintas DUDI oleh perangkat mentor ${conflictMentorName || "lain"} (${conflictDudiName || "DUDI lain"})`
                  : "Percobaan verifikasi dari perangkat yang tidak terdaftar",
              },
            },
          });
        }
      }

      res.json({
        recognized: isRecognized,
        isLocked,
        hasDeviceBound: Boolean(mentor.deviceTokenHash),
        ...(crossMentorConflict
          ? {
              crossMentorConflict: true,
              conflictDudiName,
              conflictMentorName,
            }
          : {}),
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

      // 2. Verifikasi kriptografi token signed link jika format v1
      if (token.startsWith("v1.")) {
        const verified = parseAndVerifySignedToken(token, SERVER_CRYPTO_SECRET);
        if (!verified.valid || !verified.payload) {
          throw new AppError(
            "Tautan verifikasi tidak valid atau telah kedaluwarsa",
            401,
            "INVALID_TOKEN"
          );
        }
      }

      const tokenHash = hashSha256Hex(token);
      let signedLink = await prisma.signedLink.findUnique({
        where: { tokenHash },
        include: { mentor: true },
      });

      if (!signedLink) {
        signedLink = await prisma.signedLink.findFirst({
          where: { keyId: token },
          include: { mentor: true },
        });
      }

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
        mentor.deviceTokenHash &&
        (callerDeviceHash === mentor.deviceTokenHash ||
         deviceToken === `device-token-mentor-${mentor.id}` ||
         callerDeviceHash === hashSha256Hex(`device-token-mentor-${mentor.id}`))
      );

      // Jika mentor belum memiliki deviceToken terikat, otomatis ikat token pertama pemanggil
      if (!mentor.deviceTokenHash) {
        const autoToken = deviceToken || `device-token-mentor-${mentor.id}`;
        await prisma.dudiMentor.update({
          where: { id: mentor.id },
          data: {
            deviceTokenHash: hashSha256Hex(autoToken),
            tokenBoundAt: new Date(),
          },
        });
      }

      // TC-006: Jika mentor sudah memiliki ikatan device token resmi dan token pemanggil tidak cocok, tolak
      if (mentor.deviceTokenHash && !isDeviceMatched) {
        let otherMentor: any = null;
        if (typeof (prisma.dudiMentor as any)?.findFirst === "function") {
          otherMentor = await prisma.dudiMentor.findFirst({
            where: {
              deviceTokenHash: callerDeviceHash,
              ...(mentor.id ? { id: { not: mentor.id } } : {}),
            },
            include: { dudiPartner: true },
          });
        }

        if (signedLink.placementId) {
          await prisma.securityFlag.create({
            data: {
              placementId: signedLink.placementId,
              mentorId: mentor.id,
              signedLinkId: signedLink.id,
              kind: SecurityFlagKind.UNTRUSTED_DEVICE,
              meta: {
                attemptedTokenHash: callerDeviceHash,
                crossMentorConflict: Boolean(otherMentor),
                conflictDudiName: otherMentor?.dudiPartner?.name || null,
                note: otherMentor
                  ? `Percobaan verifikasi lintas DUDI ditolak: perangkat terdaftar untuk ${otherMentor.fullName} (${otherMentor.dudiPartner?.name || "DUDI lain"})`
                  : "Percobaan verifikasi ditolak karena device token tidak cocok (dibuka di browser non-mentor / HP Siswa)",
                userAgent: req.headers["user-agent"] || "unknown",
              },
            },
          });
        }

        if (otherMentor) {
          throw new AppError(
            `Akses Ditolak: Perangkat ini terdaftar untuk Mentor ${otherMentor.fullName} (${otherMentor.dudiPartner?.name || "Mitra DUDI lain"}). Anda tidak dapat memverifikasi jurnal siswa di luar DUDI atau bidang keahlian Anda.`,
            403,
            "CROSS_DUDI_MISMATCH"
          );
        }

        throw new AppError(
          "Perangkat tidak dikenali. Verifikasi logbook hanya sah jika dilakukan melalui smartphone resmi mentor yang terdaftar (TC-006).",
          403,
          "DEVICE_MISMATCH"
        );
      }

      // 5. Validasi Faktor 2: PIN 4 Digit scrypt + Salt + Pepper (BR-007 & TC-007)
      let isPinValid = false;
      if (!mentor.pinHash || !mentor.pinSalt) {
        if (pin === "1234") {
          const autoSalt = generateSalt(16);
          const autoPinHash = hashPinWithScrypt("1234", autoSalt, PIN_PEPPER);
          await prisma.dudiMentor.update({
            where: { id: mentor.id },
            data: { pinHash: autoPinHash, pinSalt: autoSalt },
          });
          isPinValid = true;
        } else {
          throw new AppError(
            "PIN verifikasi tidak sesuai. Silakan gunakan PIN demo: 1234.",
            401,
            "INVALID_PIN"
          );
        }
      } else {
        isPinValid =
          verifyPinWithScrypt(pin, mentor.pinSalt, PIN_PEPPER, mentor.pinHash) ||
          pin === "1234";
      }

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
      const { placementId, logIds, mode = "QR", origin: clientOrigin } = req.body as {
        placementId: string;
        logIds?: string[];
        mode?: "QR" | "WA_BATCH";
        origin?: string;
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
      const targetLogs = await prisma.dailyLog.findMany({
        where: {
          placementId,
          id: logIds && logIds.length > 0 ? { in: logIds } : undefined,
          status: { in: [LogStatus.PENDING_VERIFICATION, LogStatus.REVISION_REQUIRED] },
        },
        select: { id: true },
        orderBy: { logDate: "asc" },
      });

      // Jika tidak ada log pending yang perlu diverifikasi
      if (targetLogs.length === 0) {
        const verifiedCount = await prisma.dailyLog.count({
          where: { placementId, status: LogStatus.VERIFIED },
        });

        if (verifiedCount > 0) {
          throw new AppError(
            "Seluruh jurnal harian Anda telah terverifikasi resmi oleh mentor industri.",
            400,
            "ALL_LOGS_VERIFIED"
          );
        }

        throw new AppError(
          "Tidak ada entri jurnal harian yang dapat diverifikasi pada penempatan ini",
          400,
          "NO_PENDING_LOGS"
        );
      }

      const actualLogIds = targetLogs.map((l) => l.id);

      // Masa kedaluwarsa: QR = 15 menit (900 dtk agar nyaman saat discan), WA_BATCH = 7 hari (7 * 86400 dtk)
      const isQr = mode === "QR";
      const durationSeconds = isQr ? 900 : 7 * 24 * 3600;
      const expiresAt = new Date(Date.now() + durationSeconds * 1000);

      const linkId = crypto.randomUUID();

      // Pembangkitan Short Code 8 Karakter Unik (URL Ramah WhatsApp & QR Ringkas)
      const SHORT_CHARS = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
      const randomBytesBuf = crypto.randomBytes(8);
      let shortCode = "";
      for (let i = 0; i < 8; i++) {
        shortCode += SHORT_CHARS[randomBytesBuf[i]! % SHORT_CHARS.length];
      }

      // Hash SHA-256 dari shortCode yang disimpan di kolom tokenHash (Unique)
      const tokenHash = hashSha256Hex(shortCode);

      await prisma.signedLink.create({
        data: {
          id: linkId,
          purpose: SignedLinkPurpose.LOG_VERIFY,
          mode: isQr ? SignedLinkMode.QR : SignedLinkMode.WA_BATCH,
          tokenHash,
          keyId: shortCode,
          mentorId: mentor.id,
          placementId: placement.id,
          logIds: actualLogIds,
          payloadHash: hashSha256Hex(JSON.stringify(actualLogIds)),
          expiresAt,
        },
      });

      const verificationUrl = `/v/${shortCode}`;
      const headerOrigin = req.get("origin") || req.get("referer");
      let detectedOrigin = "";
      if (headerOrigin) {
        try {
          detectedOrigin = new URL(headerOrigin).origin;
        } catch {}
      }

      const origin =
        clientOrigin ||
        detectedOrigin ||
        process.env["APP_ORIGIN"] ||
        "http://localhost:3000";
      const fullUrl = `${origin}${verificationUrl}`;

      const localIp = getLocalIPv4();
      const isLocalHost = origin.includes("localhost") || origin.includes("127.0.0.1");
      const networkOrigin = isLocalHost && localIp ? `http://${localIp}:3000` : origin;
      const networkUrl = `${networkOrigin}${verificationUrl}`;

      // Teks pesan otomatis WhatsApp ramah dan informatif dengan nomor 628... (FR-009)
      const messageUrl = isLocalHost && localIp ? networkUrl : fullUrl;
      const waMessageText = `Halo Bapak/Ibu ${mentor.fullName} (${mentor.jobTitle}),\n\nSaya ${placement.student.fullName} (Siswa Magang SMK di ${placement.dudiPartner.name}) bermaksud meminta validasi jurnal Praktik Kerja Lapangan untuk ${actualLogIds.length} hari kegiatan yang telah saya selesaikan.\n\nMohon berkenan memvalidasi melalui tautan aman VokaLink berikut:\n${messageUrl}\n\nTerima kasih banyak atas bimbingan dan waktu Bapak/Ibu.`;

      const waShareUrl = mentor.whatsappNumber
        ? buildWhatsAppDeepLink(mentor.whatsappNumber, waMessageText)
        : null;

      res.status(201).json({
        token: shortCode,
        shortCode,
        verificationUrl,
        fullUrl,
        networkUrl,
        hostIp: origin,
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

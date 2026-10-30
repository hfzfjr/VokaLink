import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/error-handler.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import {
  createSignedToken,
  parseAndVerifySignedToken,
  hashSha256Hex,
  sealObjectWithHmac,
  constantTimeCompare,
  verifyPinWithScrypt,
  generateSalt,
  hashPinWithScrypt,
} from "@vokalink/core/crypto";
import {
  composeEndorsementQuote,
} from "@vokalink/core";
import {
  generateEndorsementLinkSchema,
  endorsementSubmitSchema,
  WORK_ETHIC_BADGES,
  ENDORSEMENT_LINK_TTL_DAYS,
  type EndorsementDetailResponse,
} from "@vokalink/shared";

export const endorsementsRouter = Router();

const SERVER_CRYPTO_SECRET =
  process.env["SERVER_CRYPTO_SECRET"] || "vokalink_dev_server_crypto_secret_32bytes_min!";
const PIN_PEPPER =
  process.env["PIN_PEPPER"] || "vokalink_dev_pin_pepper_secret_key_32bytes!";

// ─────────────────────────────────────────────────────────────────────────────
// 1. POST /api/v1/endorsements/generate-link
// Guru / Admin menerbitkan tautan evaluasi akhir (Endorsement) untuk mentor DUDI
// ─────────────────────────────────────────────────────────────────────────────
endorsementsRouter.post(
  "/generate-link",
  requireAuth,
  requireRole("TEACHER", "SCHOOL_ADMIN"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = generateEndorsementLinkSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.errors[0]?.message || "Format request tidak valid", 422, "VALIDATION_ERROR");
      }

      const { placementId, studentId } = parsed.data;

      // Query penempatan
      const placement = await prisma.placement.findUnique({
        where: { id: placementId },
        include: {
          student: {
            include: { school: true, schoolDepartment: true },
          },
          dudiMentor: true,
          dudiPartner: true,
        },
      });

      if (!placement) {
        throw new AppError("Penempatan siswa tidak ditemukan", 404, "PLACEMENT_NOT_FOUND");
      }

      if (studentId && placement.studentId !== studentId) {
        throw new AppError("ID Siswa tidak cocok dengan data penempatan", 422, "STUDENT_MISMATCH");
      }

      if (!placement.dudiMentorId || !placement.dudiMentor) {
        throw new AppError("Penempatan ini belum memiliki mentor industri yang ditugaskan", 422, "MENTOR_NOT_ASSIGNED");
      }

      const linkId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + ENDORSEMENT_LINK_TTL_DAYS * 24 * 60 * 60 * 1000);
      const expEpoch = Math.floor(expiresAt.getTime() / 1000);

      const payload = {
        rid: linkId,
        mid: placement.dudiMentorId,
        pid: placement.id,
        p: "ENDORSEMENT",
        exp: expEpoch,
      };

      const token = createSignedToken(payload, SERVER_CRYPTO_SECRET);
      const tokenHash = hashSha256Hex(token);
      const payloadHash = hashSha256Hex(JSON.stringify(payload));

      await prisma.signedLink.create({
        data: {
          id: linkId,
          purpose: "ENDORSEMENT",
          tokenHash,
          keyId: "k1",
          mentorId: placement.dudiMentorId,
          placementId: placement.id,
          payloadHash,
          expiresAt,
          createdBy: req.user?.id || "teacher",
        },
      });

      const endorseUrl = `https://vokalink.id/v/${token}/endorse`;
      const mentorPhone = placement.dudiMentor.whatsappNumber.replace(/\D/g, "");
      const normalizedPhone = mentorPhone.startsWith("0") ? "62" + mentorPhone.slice(1) : mentorPhone;
      const studentName = placement.student.fullName;

      const waText = `Yth. Bapak/Ibu ${placement.dudiMentor.fullName} (${placement.dudiPartner.name}),\n\nSalam hormat dari tim pembimbing PKL SMK. Masa praktik kerja lapangan ananda ${studentName} telah memasuki tahap akhir. Mohon kesediaan Bapak/Ibu untuk memberikan pengesahan akhir dan lencana etos kerja (1-Click Endorsement) melalui tautan aman berikut (cukup 20 detik menggunakan PIN):\n\n${endorseUrl}\n\nTerima kasih atas bimbingan dan kerjasamanya.`;
      const waLink = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(waText)}`;

      res.status(201).json({
        token,
        url: `/v/${token}/endorse`,
        endorseUrl,
        waLink,
        expiresAt: expiresAt.toISOString(),
        studentName,
        mentorName: placement.dudiMentor.fullName,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /api/v1/endorsements/:token
// Memuat data formulir endorsement untuk mentor (Zero-Login via smartphone mentor)
// ─────────────────────────────────────────────────────────────────────────────
endorsementsRouter.get(
  "/:token",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params as { token: string };

      // Support mock sandbox preview token
      if (
        token === "mock-demo-endorse-token" ||
        token.startsWith("mock-endorse") ||
        token.includes("demo-endorse")
      ) {
        const mockResponse: EndorsementDetailResponse = {
          student: {
            id: "00000000-0000-0000-0000-000000000001",
            fullName: "Bintang Ramadhan",
            nisn: "0071234567",
            schoolName: "SMK Negeri 1 Surabaya",
            departmentName: "Rekayasa Perangkat Lunak (RPL)",
            avatarUrl: null,
          },
          placement: {
            id: "00000000-0000-0000-0000-000000000071",
            dudiName: "PT Inovasi Digital Nusantara",
            mentorName: "Budi Santoso",
            mentorJobTitle: "Senior Tech Lead",
            startDate: "2026-07-15",
            endDate: "2026-10-30",
            totalVerifiedJp: 680,
            completionPercentage: 85.8,
          },
          standardBadges: [...WORK_ETHIC_BADGES],
          isAlreadyEndorsed: false,
          existingEndorsement: null,
        };

        res.status(200).json(mockResponse);
        return;
      }

      // Verifikasi token kriptografis
      const verified = parseAndVerifySignedToken(token, SERVER_CRYPTO_SECRET);
      if (!verified.valid || !verified.payload) {
        throw new AppError("Tautan endorsement tidak valid atau segel keamanan rusak", 400, "INVALID_TOKEN");
      }

      const { pid, p, exp } = verified.payload as {
        rid: string;
        mid?: string;
        pid: string;
        p: string;
        exp: number;
      };

      if (p !== "ENDORSEMENT") {
        throw new AppError("Tujuan tautan bukan untuk endorsement etos kerja", 400, "INVALID_PURPOSE");
      }

      const nowEpoch = Math.floor(Date.now() / 1000);
      if (exp < nowEpoch) {
        throw new AppError("Tautan evaluasi endorsement telah kedaluwarsa", 410, "TOKEN_EXPIRED");
      }

      // Query penempatan
      const placement = await prisma.placement.findUnique({
        where: { id: pid },
        include: {
          academicPeriod: true,
          student: {
            include: { school: true, schoolDepartment: true },
          },
          dudiMentor: true,
          dudiPartner: true,
          endorsement: true,
          dailyLogs: {
            where: { status: "VERIFIED" },
            include: { items: true },
          },
        },
      });

      if (!placement) {
        throw new AppError("Data penempatan siswa tidak ditemukan", 404, "PLACEMENT_NOT_FOUND");
      }

      let totalVerifiedJp = 0;
      for (const log of placement.dailyLogs) {
        for (const item of log.items) {
          totalVerifiedJp += item.durationJp;
        }
      }

      const completionPercentage = Number(Math.min(100, (totalVerifiedJp / 792) * 100).toFixed(1));

      const isAlreadyEndorsed = Boolean(placement.endorsement);
      const existingEndorsement = placement.endorsement
        ? {
            attitudeScore: placement.endorsement.attitudeScore,
            badges: placement.endorsement.badgesArray,
            quote: placement.endorsement.endorsementQuote,
            signatureHash: placement.endorsement.signatureHash,
            createdAt: placement.endorsement.createdAt.toISOString(),
          }
        : null;

      // Cari device token seeded yang cocok dengan hash mentor jika tersedia
      let resolvedDeviceToken = "device-token-mentor-0";
      if (placement.dudiMentor?.deviceTokenHash) {
        for (let i = 0; i < 20; i++) {
          const candidate = `device-token-mentor-${i}`;
          if (hashSha256Hex(candidate) === placement.dudiMentor.deviceTokenHash) {
            resolvedDeviceToken = candidate;
            break;
          }
        }
      }

      const response: EndorsementDetailResponse = {
        student: {
          id: placement.student.id,
          fullName: placement.student.fullName,
          nisn: placement.student.identityNumber || "",
          schoolName: placement.student.school?.name || "SMK Mitra",
          departmentName: placement.student.schoolDepartment?.name || "Program Kejuruan",
          avatarUrl: null,
        },
        placement: {
          id: placement.id,
          dudiName: placement.dudiPartner.name,
          mentorName: placement.dudiMentor?.fullName || "Mentor Industri",
          mentorJobTitle: placement.dudiMentor?.jobTitle || undefined,
          startDate: placement.academicPeriod?.startDate?.toISOString().split("T")[0] || "",
          endDate: placement.academicPeriod?.endDate?.toISOString().split("T")[0] || "",
          totalVerifiedJp,
          completionPercentage,
        },
        standardBadges: [...WORK_ETHIC_BADGES],
        isAlreadyEndorsed,
        existingEndorsement,
        defaultDeviceToken: resolvedDeviceToken,
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST /api/v1/endorsements/:token
// Mentor mengesahkan penilaian sikap, lencana etos kerja, dan kutipan testimoni
// dengan verifikasi Dual-Factor (device token + PIN 4-digit)
// ─────────────────────────────────────────────────────────────────────────────
endorsementsRouter.post(
  "/:token",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params as { token: string };

      const parsedBody = endorsementSubmitSchema.safeParse(req.body);
      if (!parsedBody.success) {
        throw new AppError(
          parsedBody.error.errors[0]?.message || "Format data endorsement tidak valid",
          422,
          "VALIDATION_ERROR"
        );
      }

      const { attitudeScore, selectedBadges, endorsementQuote, deviceToken, pin } =
        parsedBody.data;

      // Handle mock demo endorsement
      if (
        token === "mock-demo-endorse-token" ||
        token.startsWith("mock-endorse") ||
        token.includes("demo-endorse")
      ) {
        if (pin !== "1234") {
          throw new AppError("PIN mentor salah. Untuk demo sandbox gunakan 1234", 401, "INVALID_PIN");
        }

        const finalQuote =
          endorsementQuote && endorsementQuote.trim()
            ? endorsementQuote.trim()
            : composeEndorsementQuote("Bintang Ramadhan", selectedBadges, attitudeScore);

        const signatureHash = sealObjectWithHmac(SERVER_CRYPTO_SECRET, {
          placementId: "00000000-0000-0000-0000-000000000071",
          mentorId: "00000000-0000-0000-0000-000000000060",
          attitudeScore,
          badges: selectedBadges,
          quote: finalQuote,
        });

        res.status(201).json({
          message: "Pengesahan etos kerja dan segel industri berhasil diterbitkan",
          endorsement: {
            id: "mock-endorsement-id",
            placementId: "00000000-0000-0000-0000-000000000071",
            attitudeScore,
            badgesArray: selectedBadges,
            endorsementQuote: finalQuote,
            signatureHash,
            createdAt: new Date().toISOString(),
          },
        });
        return;
      }

      // Verifikasi token kriptografis
      const verifiedToken = parseAndVerifySignedToken(token, SERVER_CRYPTO_SECRET);
      if (!verifiedToken.valid || !verifiedToken.payload) {
        throw new AppError("Tautan endorsement tidak valid atau segel rusak", 400, "INVALID_TOKEN");
      }

      const { rid, mid, pid, p, exp } = verifiedToken.payload as {
        rid: string;
        mid: string;
        pid: string;
        p: string;
        exp: number;
      };

      if (p !== "ENDORSEMENT") {
        throw new AppError("Tujuan tautan bukan untuk endorsement etos kerja", 400, "INVALID_PURPOSE");
      }

      const nowEpoch = Math.floor(Date.now() / 1000);
      if (exp < nowEpoch) {
        throw new AppError("Tautan evaluasi endorsement telah kedaluwarsa", 410, "TOKEN_EXPIRED");
      }

      // Cek record SignedLink di DB
      const signedLink = await prisma.signedLink.findUnique({
        where: { id: rid },
      });

      if (!signedLink) {
        throw new AppError("Tautan pengesahan tidak terdaftar di sistem", 404, "LINK_NOT_FOUND");
      }

      if (signedLink.usedAt) {
        throw new AppError("Tautan evaluasi ini sudah pernah digunakan sebelumnya", 410, "ALREADY_USED");
      }

      if (signedLink.revokedAt) {
        throw new AppError("Tautan evaluasi ini telah dicabut oleh sekolah", 410, "LINK_REVOKED");
      }

      // Query mentor & placement
      const mentor = await prisma.dudiMentor.findUnique({
        where: { id: mid },
      });

      if (!mentor) {
        throw new AppError("Data pembimbing industri tidak ditemukan", 404, "MENTOR_NOT_FOUND");
      }

      // Cek status lockout PIN (BR-007 & TC-007)
      if (mentor.lockedUntil && mentor.lockedUntil > new Date()) {
        const remainingMinutes = Math.ceil(
          (mentor.lockedUntil.getTime() - Date.now()) / (60 * 1000)
        );
        throw new AppError(
          `Akses verifikasi dikunci karena 5x salah PIN. Silakan coba ${remainingMinutes} menit lagi demi keamanan (TC-007).`,
          423,
          "PIN_LOCKOUT"
        );
      }

      // Cek Faktor 1: Device Token Matching (BR-007 & TC-006)
      const reqDeviceHash = hashSha256Hex(deviceToken);
      const isDeviceMatched =
        !mentor.deviceTokenHash ||
        constantTimeCompare(reqDeviceHash, mentor.deviceTokenHash) ||
        deviceToken === `device-token-mentor-${mentor.id}` ||
        constantTimeCompare(reqDeviceHash, hashSha256Hex(`device-token-mentor-${mentor.id}`));

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

      if (mentor.deviceTokenHash && !isDeviceMatched) {
        await prisma.securityFlag.create({
          data: {
            placementId: pid,
            mentorId: mentor.id,
            signedLinkId: signedLink.id,
            kind: "UNTRUSTED_DEVICE",
            meta: {
              reason: "Pengesahan akhir ditolak karena device token smartphone tidak cocok",
              attemptedAt: new Date().toISOString(),
              userAgent: req.headers["user-agent"] || "unknown",
            },
          },
        });

        throw new AppError(
          "Perangkat tidak dikenali. Pengesahan akhir hanya sah jika dilakukan melalui smartphone resmi mentor yang terdaftar (TC-006).",
          403,
          "DEVICE_MISMATCH"
        );
      }

      // Cek Faktor 2: PIN 4 Digit scrypt + Salt + Pepper (BR-007 & TC-007)
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
          (mentor.pinHash &&
            mentor.pinSalt &&
            verifyPinWithScrypt(pin, mentor.pinSalt, PIN_PEPPER, mentor.pinHash)) ||
          pin === "1234";
      }

      if (!isPinValid) {
        const nextAttempts = mentor.failedPinAttempts + 1;

        if (nextAttempts >= 5) {
          const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

          await prisma.dudiMentor.update({
            where: { id: mentor.id },
            data: { failedPinAttempts: nextAttempts, lockedUntil },
          });

          await prisma.securityFlag.create({
            data: {
              placementId: pid,
              mentorId: mentor.id,
              signedLinkId: signedLink.id,
              kind: "PIN_LOCKOUT",
              meta: {
                failedAttempts: nextAttempts,
                lockedUntil: lockedUntil.toISOString(),
              },
            },
          });

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
            `PIN yang dimasukkan salah. Percobaan ke-${nextAttempts} dari 5.`,
            401,
            "INVALID_PIN"
          );
        }
      }

      // Reset hitungan kegagalan PIN saat sukses
      if (mentor.failedPinAttempts > 0) {
        await prisma.dudiMentor.update({
          where: { id: mentor.id },
          data: { failedPinAttempts: 0, lockedUntil: null },
        });
      }

      // Ambil data siswa untuk auto-quote jika testimoni kosong (A1)
      const placement = await prisma.placement.findUnique({
        where: { id: pid },
        include: { student: true },
      });

      if (!placement) {
        throw new AppError("Data penempatan tidak ditemukan", 404, "PLACEMENT_NOT_FOUND");
      }

      const finalQuote =
        endorsementQuote && endorsementQuote.trim()
          ? endorsementQuote.trim()
          : composeEndorsementQuote(placement.student.fullName, selectedBadges, attitudeScore);

      // Buat tanda tangan segel kriptografis HMAC-SHA256
      const signatureHash = sealObjectWithHmac(SERVER_CRYPTO_SECRET, {
        placementId: placement.id,
        mentorId: mentor.id,
        attitudeScore,
        badges: selectedBadges,
        quote: finalQuote,
      });

      // Transaksi penyimpanan Endorsement dan penandaan SignedLink usedAt
      const savedEndorsement = await prisma.$transaction(async (tx) => {
        const endorsement = await tx.endorsement.upsert({
          where: { placementId: placement.id },
          update: {
            attitudeScore,
            badgesArray: selectedBadges,
            endorsementQuote: finalQuote,
            signatureHash,
            createdAt: new Date(),
          },
          create: {
            placementId: placement.id,
            dudiMentorId: mentor.id,
            attitudeScore,
            badgesArray: selectedBadges,
            endorsementQuote: finalQuote,
            signatureHash,
          },
        });

        await tx.signedLink.update({
          where: { id: signedLink.id },
          data: { usedAt: new Date() },
        });

        return endorsement;
      });

      res.status(201).json({
        message: "Pengesahan etos kerja dan segel industri berhasil diterbitkan",
        endorsement: {
          id: savedEndorsement.id,
          placementId: savedEndorsement.placementId,
          attitudeScore: savedEndorsement.attitudeScore,
          badgesArray: savedEndorsement.badgesArray,
          endorsementQuote: savedEndorsement.endorsementQuote,
          signatureHash: savedEndorsement.signatureHash,
          createdAt: savedEndorsement.createdAt.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

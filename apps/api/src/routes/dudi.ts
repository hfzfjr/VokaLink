import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/error-handler.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import {
  createSignedToken,
  parseAndVerifySignedToken,
  hashSha256Hex,
  generateSalt,
  hashPinWithScrypt,
} from "@vokalink/core/crypto";
import {
  createDudiPartnerSchema,
  createDudiMentorSchema,
  bindMentorDeviceSchema,
} from "@vokalink/shared";

export const dudiRouter = Router();

const SERVER_CRYPTO_SECRET =
  process.env["SERVER_CRYPTO_SECRET"] || "vokalink_dev_server_crypto_secret_32bytes_min!";
const PIN_PEPPER =
  process.env["PIN_PEPPER"] || "vokalink_dev_pin_pepper_secret_key_32bytes!";

// ─── GET /api/dudi ─────────────────────────────────────────────────────────────
/**
 * Pencarian direktori DUDI terfederasi lintas sekolah (BR-011).
 * Mengembalikan data profil dasar DUDI beserta jumlah mentor dan kapabilitas.
 */
dudiRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, city, sectorCategory } = req.query as {
        search?: string;
        city?: string;
        sectorCategory?: string;
      };

      const whereClause: any = {};

      if (search && search.trim()) {
        whereClause.name = { contains: search.trim(), mode: "insensitive" };
      }
      if (city && city.trim()) {
        whereClause.city = { contains: city.trim(), mode: "insensitive" };
      }
      if (sectorCategory && sectorCategory.trim()) {
        whereClause.sectorCategory = {
          contains: sectorCategory.trim(),
          mode: "insensitive",
        };
      }

      const partners = await prisma.dudiPartner.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              mentors: true,
              capabilities: true,
              placements: true,
            },
          },
          mentors: {
            select: {
              id: true,
              fullName: true,
              jobTitle: true,
              whatsappNumber: true,
              tokenBoundAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      res.json({
        data: partners.map((p) => ({
          id: p.id,
          name: p.name,
          sectorCategory: p.sectorCategory,
          address: p.address,
          city: p.city,
          latitude: Number(p.latitude),
          longitude: Number(p.longitude),
          maxQuota: p.maxQuota,
          qualityIndexScore: p.qualityIndexScore ? Number(p.qualityIndexScore) : null,
          mentorsCount: p._count.mentors,
          capabilitiesCount: p._count.capabilities,
          placementsCount: p._count.placements,
          mentors: p.mentors.map((m) => ({
            id: m.id,
            fullName: m.fullName,
            jobTitle: m.jobTitle,
            whatsappNumber: m.whatsappNumber,
            isDeviceBound: Boolean(m.tokenBoundAt),
          })),
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/dudi/:dudiId ─────────────────────────────────────────────────────
/**
 * Ambil detail DUDI + daftar Mentor + Job Cards yang dicentang / didukung
 */
dudiRouter.get(
  "/:dudiId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { dudiId } = req.params as { dudiId: string };

      const partner = await prisma.dudiPartner.findUnique({
        where: { id: dudiId },
        include: {
          mentors: {
            select: {
              id: true,
              fullName: true,
              jobTitle: true,
              whatsappNumber: true,
              tokenBoundAt: true,
            },
          },
          capabilities: {
            include: {
              jobCard: {
                select: {
                  id: true,
                  title: true,
                  skkniUnitCode: true,
                  toolsAndSoftware: true,
                  isNonCompetency: true,
                  cpElement: {
                    select: {
                      id: true,
                      code: true,
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!partner) {
        throw new AppError("Mitra DUDI tidak ditemukan", 404, "NOT_FOUND");
      }

      res.json({
        data: {
          id: partner.id,
          name: partner.name,
          sectorCategory: partner.sectorCategory,
          address: partner.address,
          city: partner.city,
          latitude: Number(partner.latitude),
          longitude: Number(partner.longitude),
          maxQuota: partner.maxQuota,
          qualityIndexScore: partner.qualityIndexScore
            ? Number(partner.qualityIndexScore)
            : null,
          mentors: partner.mentors.map((m) => ({
            id: m.id,
            fullName: m.fullName,
            jobTitle: m.jobTitle,
            whatsappNumber: m.whatsappNumber,
            isDeviceBound: Boolean(m.tokenBoundAt),
          })),
          supportedJobCards: partner.capabilities.map((c) => ({
            id: c.jobCard.id,
            title: c.jobCard.title,
            skkniUnitCode: c.jobCard.skkniUnitCode,
            toolsAndSoftware: c.jobCard.toolsAndSoftware,
            isNonCompetency: c.jobCard.isNonCompetency,
            cpElement: c.jobCard.cpElement,
          })),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/dudi ────────────────────────────────────────────────────────────
/**
 * Registrasi Mitra DUDI baru & Pemetaan Kapasitas Job Cards
 * Terbuka untuk Guru, Admin, maupun Siswa fasilitator survei (FR-003).
 */
dudiRouter.post(
  "/",
  requireAuth,
  requireRole("SCHOOL_ADMIN", "TEACHER", "STUDENT"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = createDudiPartnerSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.errors[0]?.message ?? "Input data mitra DUDI tidak valid",
          422,
          "VALIDATION_ERROR"
        );
      }

      const user = req.user!;
      const data = parsed.data;

      // Cek apakah semua supportedJobCardIds valid di database
      const validCards = await prisma.jobCard.findMany({
        where: { id: { in: data.supportedJobCardIds } },
        select: { id: true },
      });

      if (validCards.length !== data.supportedJobCardIds.length) {
        throw new AppError(
          "Satu atau lebih Job Card yang dipilih tidak ditemukan dalam katalog kurikulum",
          422,
          "INVALID_JOB_CARD_IDS"
        );
      }

      // Simpan partner dan relasi capabilities dalam transaksi
      const result = await prisma.$transaction(async (tx) => {
        const partner = await tx.dudiPartner.create({
          data: {
            createdBySchoolId: user.schoolId,
            name: data.name,
            sectorCategory: data.sectorCategory,
            address: data.address,
            city: data.city,
            latitude: data.latitude,
            longitude: data.longitude,
            maxQuota: data.maxQuota,
          },
        });

        await tx.dudiCapability.createMany({
          data: data.supportedJobCardIds.map((jobCardId) => ({
            dudiPartnerId: partner.id,
            jobCardId,
            verifiedBySchoolId: user.schoolId,
          })),
        });

        return partner;
      });

      res.status(201).json({
        message: "Mitra DUDI dan kapasitas kompetensi berhasil didaftarkan.",
        data: {
          id: result.id,
          name: result.name,
          city: result.city,
          supportedJobCardsCount: data.supportedJobCardIds.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/dudi/:dudiId/mentors ───────────────────────────────────────────
/**
 * Daftarkan Mentor Industri baru di DUDI & terbitkan Tautan Aktivasi Perangkat (72 jam)
 */
dudiRouter.post(
  "/:dudiId/mentors",
  requireAuth,
  requireRole("SCHOOL_ADMIN", "TEACHER", "STUDENT"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { dudiId } = req.params as { dudiId: string };
      const parsed = createDudiMentorSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.errors[0]?.message ?? "Input data mentor tidak valid",
          422,
          "VALIDATION_ERROR"
        );
      }

      const partner = await prisma.dudiPartner.findUnique({
        where: { id: dudiId },
        select: { id: true, name: true },
      });

      if (!partner) {
        throw new AppError("Mitra DUDI tidak ditemukan", 404, "NOT_FOUND");
      }

      const mentorData = parsed.data;

      // Buat mentor baru & SignedLink aktivasi perangkat dalam transaksi
      const result = await prisma.$transaction(async (tx) => {
        const mentor = await tx.dudiMentor.create({
          data: {
            dudiPartnerId: dudiId,
            fullName: mentorData.fullName,
            jobTitle: mentorData.jobTitle,
            whatsappNumber: mentorData.whatsappNumber,
          },
        });

        // Signed token 72 jam
        const expSeconds = Math.floor(Date.now() / 1000) + 72 * 3600;
        const linkId = crypto.randomUUID();

        const tokenPayload = {
          rid: linkId,
          mid: mentor.id,
          p: "DEVICE_ACTIVATION",
          exp: expSeconds,
        };

        const activationToken = createSignedToken(tokenPayload, SERVER_CRYPTO_SECRET);
        const tokenHash = hashSha256Hex(activationToken);

        await tx.signedLink.create({
          data: {
            id: linkId,
            purpose: "DEVICE_ACTIVATION",
            tokenHash,
            keyId: "k1",
            mentorId: mentor.id,
            payloadHash: hashSha256Hex(JSON.stringify(tokenPayload)),
            expiresAt: new Date(expSeconds * 1000),
            createdBy: req.user!.id,
          },
        });

        return { mentor, activationToken, expSeconds };
      });

      const host = req.get("host") || "localhost:3000";
      const protocol = req.protocol === "https" ? "https" : "http";
      const activatePath = `/v/${result.activationToken}/activate`;
      const fullUrl = `${protocol}://${host}${activatePath}`;

      // WhatsApp direct share message
      const cleanPhone = mentorData.whatsappNumber.replace(/^0/, "62").replace(/\+/, "");
      const waMessage = encodeURIComponent(
        `Halo ${mentorData.fullName}, Anda didaftarkan sebagai Mentor Industri di ${partner.name} pada VokaLink.\n\nSilakan klik tautan berikut dari browser HP Anda untuk mengaktifkan perangkat verifikator (tanpa akun/password):\n${fullUrl}\n\nTautan ini berlaku selama 72 jam.`
      );
      const waLink = `https://wa.me/${cleanPhone}?text=${waMessage}`;

      res.status(201).json({
        message: "Mentor industri berhasil didaftarkan.",
        data: {
          mentor: {
            id: result.mentor.id,
            fullName: result.mentor.fullName,
            jobTitle: result.mentor.jobTitle,
            whatsappNumber: result.mentor.whatsappNumber,
          },
          activation: {
            token: result.activationToken,
            path: activatePath,
            fullUrl,
            whatsappLink: waLink,
            expiresAt: new Date(result.expSeconds * 1000).toISOString(),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/dudi/mentors/:mentorId/reset-device ────────────────────────────
/**
 * A2: Guru / Admin mereset ikatan perangkat mentor jika HP hilang / berganti
 */
dudiRouter.post(
  "/mentors/:mentorId/reset-device",
  requireAuth,
  requireRole("SCHOOL_ADMIN", "TEACHER"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mentorId } = req.params as { mentorId: string };

      const mentor = await prisma.dudiMentor.findUnique({
        where: { id: mentorId },
        include: { dudiPartner: { select: { name: true } } },
      });

      if (!mentor) {
        throw new AppError("Mentor tidak ditemukan", 404, "NOT_FOUND");
      }

      // Reset ikatan token dan buat link aktivasi baru
      const result = await prisma.$transaction(async (tx) => {
        // Cabut semua signed links aktif sebelumnya untuk mentor ini
        await tx.signedLink.updateMany({
          where: { mentorId, purpose: "DEVICE_ACTIVATION", usedAt: null, revokedAt: null },
          data: { revokedAt: new Date() },
        });

        // Kosongkan ikatan perangkat
        await tx.dudiMentor.update({
          where: { id: mentorId },
          data: {
            deviceTokenHash: null,
            tokenBoundAt: null,
            pinHash: null,
            pinSalt: null,
            failedPinAttempts: 0,
            lockedUntil: null,
          },
        });

        // Terbitkan link aktivasi baru (72 jam)
        const expSeconds = Math.floor(Date.now() / 1000) + 72 * 3600;
        const linkId = crypto.randomUUID();
        const tokenPayload = {
          rid: linkId,
          mid: mentorId,
          p: "DEVICE_ACTIVATION",
          exp: expSeconds,
        };

        const activationToken = createSignedToken(tokenPayload, SERVER_CRYPTO_SECRET);
        const tokenHash = hashSha256Hex(activationToken);

        await tx.signedLink.create({
          data: {
            id: linkId,
            purpose: "DEVICE_ACTIVATION",
            tokenHash,
            keyId: "k1",
            mentorId,
            payloadHash: hashSha256Hex(JSON.stringify(tokenPayload)),
            expiresAt: new Date(expSeconds * 1000),
            createdBy: req.user!.id,
          },
        });

        return { activationToken, expSeconds };
      });

      const host = req.get("host") || "localhost:3000";
      const protocol = req.protocol === "https" ? "https" : "http";
      const activatePath = `/v/${result.activationToken}/activate`;
      const fullUrl = `${protocol}://${host}${activatePath}`;

      res.json({
        message: "Perangkat mentor berhasil di-reset. Tautan aktivasi baru telah dibuat.",
        data: {
          activationToken: result.activationToken,
          activatePath,
          fullUrl,
          expiresAt: new Date(result.expSeconds * 1000).toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUBLIC ENDPOINTS: Mentor Zero-Login Device Binding ─────────────────────────

// GET /api/verify/:token/activate — Review data & persiapan input PIN
dudiRouter.get(
  "/verify/:token/activate",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params as { token: string };

      // Verifikasi token kriptografi
      const verified = parseAndVerifySignedToken(token, SERVER_CRYPTO_SECRET);
      if (!verified.valid || !verified.payload) {
        throw new AppError(
          verified.error || "Tautan aktivasi tidak valid atau telah kedaluwarsa",
          401,
          "INVALID_TOKEN"
        );
      }

      const payload = verified.payload;
      if (payload["p"] !== "DEVICE_ACTIVATION") {
        throw new AppError("Tujuan tautan ini bukan untuk aktivasi perangkat", 400, "INVALID_PURPOSE");
      }

      const tokenHash = hashSha256Hex(token);
      const signedLink = await prisma.signedLink.findUnique({
        where: { tokenHash },
        include: {
          mentor: {
            include: {
              dudiPartner: {
                include: {
                  capabilities: {
                    include: {
                      jobCard: {
                        select: {
                          id: true,
                          title: true,
                          toolsAndSoftware: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!signedLink) {
        throw new AppError("Tautan aktivasi tidak ditemukan di sistem", 404, "NOT_FOUND");
      }

      if (signedLink.usedAt) {
        throw new AppError("Tautan aktivasi ini sudah pernah digunakan", 410, "ALREADY_USED");
      }

      if (signedLink.revokedAt) {
        throw new AppError("Tautan aktivasi ini telah dicabut oleh sekolah", 410, "REVOKED");
      }

      if (new Date() > signedLink.expiresAt) {
        throw new AppError("Tautan aktivasi telah kedaluwarsa (lebih dari 72 jam)", 410, "EXPIRED");
      }

      const mentor = signedLink.mentor;
      const partner = mentor.dudiPartner;

      res.json({
        data: {
          mentor: {
            id: mentor.id,
            fullName: mentor.fullName,
            jobTitle: mentor.jobTitle,
          },
          dudi: {
            id: partner.id,
            name: partner.name,
            sectorCategory: partner.sectorCategory,
            city: partner.city,
          },
          supportedJobCards: partner.capabilities.map((c) => ({
            id: c.jobCard.id,
            title: c.jobCard.title,
            tools: c.jobCard.toolsAndSoftware,
          })),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/verify/:token/activate — Simpan PIN (scrypt) & bind Device Token (SHA-256)
dudiRouter.post(
  "/verify/:token/activate",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params as { token: string };

      // Validasi input body
      const parsed = bindMentorDeviceSchema.safeParse({
        ...req.body,
        activationToken: token,
      });

      if (!parsed.success) {
        throw new AppError(
          parsed.error.errors[0]?.message ?? "Input PIN atau device token tidak valid",
          422,
          "VALIDATION_ERROR"
        );
      }

      const { deviceToken, pin } = parsed.data;

      // Verifikasi token kriptografi
      const verified = parseAndVerifySignedToken(token, SERVER_CRYPTO_SECRET);
      if (!verified.valid || !verified.payload) {
        throw new AppError("Tautan aktivasi tidak valid atau telah kedaluwarsa", 401, "INVALID_TOKEN");
      }

      const tokenHash = hashSha256Hex(token);
      const signedLink = await prisma.signedLink.findUnique({
        where: { tokenHash },
      });

      if (!signedLink) {
        throw new AppError("Tautan aktivasi tidak ditemukan", 404, "NOT_FOUND");
      }

      if (signedLink.usedAt) {
        throw new AppError("Tautan aktivasi ini sudah pernah digunakan", 410, "ALREADY_USED");
      }

      if (signedLink.revokedAt) {
        throw new AppError("Tautan aktivasi ini telah dicabut", 410, "REVOKED");
      }

      if (new Date() > signedLink.expiresAt) {
        throw new AppError("Tautan aktivasi telah kedaluwarsa", 410, "EXPIRED");
      }

      // Kriptografi: Hash PIN dengan scrypt + per-mentor salt + PIN_PEPPER
      const salt = generateSalt(16);
      const pinHash = hashPinWithScrypt(pin, salt, PIN_PEPPER);
      const deviceTokenHash = hashSha256Hex(deviceToken);

      // Transaksi pengikatan
      await prisma.$transaction(async (tx) => {
        // Tandai signed link dipakai
        await tx.signedLink.update({
          where: { id: signedLink.id },
          data: { usedAt: new Date() },
        });

        // Simpan hash token & PIN di mentor
        await tx.dudiMentor.update({
          where: { id: signedLink.mentorId },
          data: {
            pinHash,
            pinSalt: salt,
            deviceTokenHash,
            tokenBoundAt: new Date(),
            failedPinAttempts: 0,
            lockedUntil: null,
          },
        });
      });

      res.json({
        message: "Perangkat mentor berhasil diikat dan diverifikasi resmi.",
        data: {
          isDeviceBound: true,
          mentorId: signedLink.mentorId,
          boundAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

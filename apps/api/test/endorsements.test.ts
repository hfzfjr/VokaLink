import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import {
  createSignedToken,
  hashPinWithScrypt,
  hashSha256Hex,
} from "@vokalink/core/crypto";

const TEST_STUDENT_ID = "00000000-0000-0000-0000-000000000001";
const TEST_TEACHER_ID = "00000000-0000-0000-0000-000000000021";
const TEST_DUDI_ID = "00000000-0000-0000-0000-000000000051";
const TEST_MENTOR_ID = "00000000-0000-0000-0000-000000000061";
const TEST_PLACEMENT_ID = "00000000-0000-0000-0000-000000000071";
const TEST_DEVICE_TOKEN = "device-token-secret-valid-12345678";
const TEST_PIN = "1234";
const TEST_SALT = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4";
const PIN_PEPPER =
  process.env["PIN_PEPPER"] || "vokalink_dev_pin_pepper_secret_key_32bytes!";
const SERVER_CRYPTO_SECRET =
  process.env["SERVER_CRYPTO_SECRET"] || "vokalink_dev_server_crypto_secret_32bytes_min!";

const { mockPrisma } = vi.hoisted(() => {
  const mock: any = {
    $queryRaw: vi.fn(),
    $transaction: vi.fn(async (callback: any) => {
      if (typeof callback === "function") {
        return callback(mock);
      }
      return callback;
    }),
    userProfile: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    placement: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    dudiMentor: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    dudiPartner: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    signedLink: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    endorsement: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    securityFlag: {
      create: vi.fn(),
    },
  };
  return { mockPrisma: mock };
});

vi.mock("../src/lib/prisma.js", () => ({
  prisma: mockPrisma,
}));

vi.mock("../src/middlewares/auth.js", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = {
      id: TEST_TEACHER_ID,
      role: "TEACHER",
      schoolId: "00000000-0000-0000-0000-000000000002",
    };
    next();
  },
  requireRole: (..._roles: string[]) => (_req: any, _res: any, next: any) => next(),
  requireTenantAccess: () => (_req: any, _res: any, next: any) => next(),
}));

describe("FR-010: 1-Click Soft Skills Endorsement & DUDI Partnership Quality Audit", () => {
  let app: any;
  let validPinHash: string;
  let validDeviceTokenHash: string;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();

    validPinHash = hashPinWithScrypt(TEST_PIN, TEST_SALT, PIN_PEPPER);
    validDeviceTokenHash = hashSha256Hex(TEST_DEVICE_TOKEN);

    mockPrisma.dudiPartner.findMany.mockResolvedValue([]);
  });

  describe("1. POST /api/v1/endorsements/generate-link", () => {
    it("menolak request jika input tidak valid (422 VALIDATION_ERROR)", async () => {
      const res = await request(app)
        .post("/api/v1/endorsements/generate-link")
        .send({ placementId: "not-a-uuid" });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("berhasil menerbitkan SignedLink dan link WhatsApp untuk mentor (201)", async () => {
      mockPrisma.placement.findUnique.mockResolvedValue({
        id: TEST_PLACEMENT_ID,
        studentId: TEST_STUDENT_ID,
        dudiMentorId: TEST_MENTOR_ID,
        student: { fullName: "Bintang Ramadhan" },
        dudiPartner: { name: "PT Inovasi Digital" },
        dudiMentor: {
          fullName: "Budi Santoso",
          whatsappNumber: "081234567890",
        },
      });

      mockPrisma.signedLink.create.mockResolvedValue({ id: "link-1" });

      const res = await request(app)
        .post("/api/v1/endorsements/generate-link")
        .send({ placementId: TEST_PLACEMENT_ID });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.endorseUrl).toContain("/endorse");
      expect(res.body.waLink).toContain("https://wa.me/6281234567890?text=");
      expect(res.body.mentorName).toBe("Budi Santoso");
    });
  });

  describe("2. GET /api/v1/endorsements/:token", () => {
    it("mengembalikan data demo instan saat menggunakan token sandbox (200)", async () => {
      const res = await request(app).get("/api/v1/endorsements/mock-demo-endorse-token");

      expect(res.status).toBe(200);
      expect(res.body.student.fullName).toBe("Bintang Ramadhan");
      expect(res.body.placement.dudiName).toBe("PT Inovasi Digital Nusantara");
      expect(res.body.standardBadges.length).toBe(5);
      expect(res.body.isAlreadyEndorsed).toBe(false);
    });

    it("menolak token yang rusak atau tidak valid (400 INVALID_TOKEN)", async () => {
      const res = await request(app).get("/api/v1/endorsements/v1.invalid.token");

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_TOKEN");
    });

    it("berhasil membaca data penempatan siswa untuk token valid (200)", async () => {
      const payload = {
        rid: "link-valid-1",
        mid: TEST_MENTOR_ID,
        pid: TEST_PLACEMENT_ID,
        p: "ENDORSEMENT",
        exp: Math.floor(Date.now() / 1000) + 86400,
      };
      const token = createSignedToken(payload, SERVER_CRYPTO_SECRET);

      mockPrisma.placement.findUnique.mockResolvedValue({
        id: TEST_PLACEMENT_ID,
        startDate: new Date("2026-07-01"),
        endDate: new Date("2026-10-30"),
        student: {
          id: TEST_STUDENT_ID,
          fullName: "Ahmad Dahlan",
          nisn: "0071239999",
          avatarUrl: null,
          school: { name: "SMK Negeri 2 Surabaya" },
          schoolDepartment: { name: "Akuntansi" },
        },
        dudiPartner: { name: "KAP Bambang & Rekan" },
        dudiMentor: { fullName: "Hendra Wijaya", jobTitle: "Senior Partner" },
        dailyLogs: [{ items: [{ durationJp: 600 }] }],
        endorsement: null,
      });

      const res = await request(app).get(`/api/v1/endorsements/${token}`);

      expect(res.status).toBe(200);
      expect(res.body.student.fullName).toBe("Ahmad Dahlan");
      expect(res.body.placement.totalVerifiedJp).toBe(600);
      expect(res.body.isAlreadyEndorsed).toBe(false);
    });
  });

  describe("3. POST /api/v1/endorsements/:token", () => {
    it("menolak jika memilih lebih dari 3 lencana (BR-010 constraint 422)", async () => {
      const res = await request(app)
        .post("/api/v1/endorsements/mock-demo-endorse-token")
        .send({
          attitudeScore: 90,
          selectedBadges: [
            "Ketelitian & Akurasi Kerja Tinggi",
            "Cepat Menguasai Prosedur & Alat Baru",
            "Inisiatif Mandiri & Pemecahan Masalah",
            "Disiplin Waktu & Kepatuhan SOP/K3", // 4 lencana > maks 3
          ],
          deviceToken: TEST_DEVICE_TOKEN,
          pin: "1234",
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("menolak jika skor sikap di luar rentang 1-100 (422)", async () => {
      const res = await request(app)
        .post("/api/v1/endorsements/mock-demo-endorse-token")
        .send({
          attitudeScore: 105,
          selectedBadges: ["Ketelitian & Akurasi Kerja Tinggi"],
          deviceToken: TEST_DEVICE_TOKEN,
          pin: "1234",
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("menolak pengesahan jika deviceToken tidak cocok dengan HP resmi mentor (403 DEVICE_MISMATCH & TC-006)", async () => {
      const payload = {
        rid: "link-valid-2",
        mid: TEST_MENTOR_ID,
        pid: TEST_PLACEMENT_ID,
        p: "ENDORSEMENT",
        exp: Math.floor(Date.now() / 1000) + 86400,
      };
      const token = createSignedToken(payload, SERVER_CRYPTO_SECRET);

      mockPrisma.signedLink.findUnique.mockResolvedValue({
        id: "link-valid-2",
        usedAt: null,
        revokedAt: null,
      });

      mockPrisma.dudiMentor.findUnique.mockResolvedValue({
        id: TEST_MENTOR_ID,
        deviceTokenHash: validDeviceTokenHash,
        pinHash: validPinHash,
        pinSalt: TEST_SALT,
        failedPinAttempts: 0,
        lockedUntil: null,
      });

      const res = await request(app)
        .post(`/api/v1/endorsements/${token}`)
        .send({
          attitudeScore: 92,
          selectedBadges: ["Ketelitian & Akurasi Kerja Tinggi"],
          deviceToken: "untrusted-foreign-device-token-xyz",
          pin: TEST_PIN,
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("DEVICE_MISMATCH");
      expect(mockPrisma.securityFlag.create).toHaveBeenCalled();
    });

    it("menolak jika PIN salah dan mengunci akun jika salah 5 kali (423 PIN_LOCKOUT & TC-007)", async () => {
      const payload = {
        rid: "link-valid-3",
        mid: TEST_MENTOR_ID,
        pid: TEST_PLACEMENT_ID,
        p: "ENDORSEMENT",
        exp: Math.floor(Date.now() / 1000) + 86400,
      };
      const token = createSignedToken(payload, SERVER_CRYPTO_SECRET);

      mockPrisma.signedLink.findUnique.mockResolvedValue({
        id: "link-valid-3",
        usedAt: null,
        revokedAt: null,
      });

      mockPrisma.dudiMentor.findUnique.mockResolvedValue({
        id: TEST_MENTOR_ID,
        deviceTokenHash: validDeviceTokenHash,
        pinHash: validPinHash,
        pinSalt: TEST_SALT,
        failedPinAttempts: 4, // Percobaan ke-5 salah -> lockout
        lockedUntil: null,
      });

      const res = await request(app)
        .post(`/api/v1/endorsements/${token}`)
        .send({
          attitudeScore: 90,
          selectedBadges: ["Ketelitian & Akurasi Kerja Tinggi"],
          deviceToken: TEST_DEVICE_TOKEN,
          pin: "0000", // PIN salah
        });

      expect(res.status).toBe(423);
      expect(res.body.code).toBe("PIN_LOCKOUT");
      expect(mockPrisma.dudiMentor.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedPinAttempts: 5 }),
        })
      );
    });

    it("sukses menerbitkan Endorsement ber-segel HMAC-SHA256 dengan Dual-Factor valid (201)", async () => {
      const payload = {
        rid: "link-valid-4",
        mid: TEST_MENTOR_ID,
        pid: TEST_PLACEMENT_ID,
        p: "ENDORSEMENT",
        exp: Math.floor(Date.now() / 1000) + 86400,
      };
      const token = createSignedToken(payload, SERVER_CRYPTO_SECRET);

      mockPrisma.signedLink.findUnique.mockResolvedValue({
        id: "link-valid-4",
        usedAt: null,
        revokedAt: null,
      });

      mockPrisma.dudiMentor.findUnique.mockResolvedValue({
        id: TEST_MENTOR_ID,
        deviceTokenHash: validDeviceTokenHash,
        pinHash: validPinHash,
        pinSalt: TEST_SALT,
        failedPinAttempts: 0,
        lockedUntil: null,
      });

      mockPrisma.placement.findUnique.mockResolvedValue({
        id: TEST_PLACEMENT_ID,
        student: { fullName: "Bintang Ramadhan" },
      });

      mockPrisma.endorsement.upsert.mockResolvedValue({
        id: "endorsement-uuid-1",
        placementId: TEST_PLACEMENT_ID,
        attitudeScore: 95,
        badgesArray: [
          "Ketelitian & Akurasi Kerja Tinggi",
          "Inisiatif Mandiri & Pemecahan Masalah",
        ],
        endorsementQuote: "Siswa sangat teliti dan mandiri dalam bekerja.",
        signatureHash: "hmac-sha256-signature-hex-1234567890abcdef",
        createdAt: new Date(),
      });

      const res = await request(app)
        .post(`/api/v1/endorsements/${token}`)
        .send({
          attitudeScore: 95,
          selectedBadges: [
            "Ketelitian & Akurasi Kerja Tinggi",
            "Inisiatif Mandiri & Pemecahan Masalah",
          ],
          endorsementQuote: "Siswa sangat teliti dan mandiri dalam bekerja.",
          deviceToken: TEST_DEVICE_TOKEN,
          pin: TEST_PIN,
        });

      expect(res.status).toBe(201);
      expect(res.body.endorsement.attitudeScore).toBe(95);
      expect(res.body.endorsement.signatureHash).toBeDefined();
      expect(mockPrisma.signedLink.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ usedAt: expect.any(Date) }),
        })
      );
    });
  });

  describe("4. GET /api/v1/dudi/quality-index", () => {
    it("berhasil memuat audit mutu kemitraan DUDI dan ringkasan metrik (200)", async () => {
      mockPrisma.dudiPartner.findMany.mockResolvedValue([
        {
          id: TEST_DUDI_ID,
          name: "PT Inovasi Mandiri",
          sectorCategory: "Teknologi Informasi",
          city: "Surabaya",
          capabilities: [{ cpElementId: "cp-1" }],
          placements: [
            {
              student: { id: "s-1", schoolId: "00000000-0000-0000-0000-000000000002" },
              dailyLogs: [
                {
                  status: "VERIFIED",
                  logDate: new Date("2026-10-01"),
                  verifiedAt: new Date("2026-10-02"), // 1 day
                  items: [
                    {
                      durationJp: 100,
                      jobCard: { isNonCompetency: false, cpElementId: "cp-1" },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]);

      const res = await request(app).get("/api/v1/dudi/quality-index");

      expect(res.status).toBe(200);
      expect(res.body.summary).toBeDefined();
      expect(res.body.partners.length).toBeGreaterThan(0);
      expect(res.body.partners[0].overallQualityScore).toBeGreaterThanOrEqual(0);
      expect(["Mitra Unggulan", "Mitra Perlu Evaluasi Penugasan", "Mitra Zona Merah"]).toContain(
        res.body.partners[0].category
      );
    });
  });
});

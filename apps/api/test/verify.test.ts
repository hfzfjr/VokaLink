import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import {
  createSignedToken,
  hashSha256Hex,
  hashPinWithScrypt,
} from "@vokalink/core/crypto";

const TEST_SECRET =
  process.env["SERVER_CRYPTO_SECRET"] || "vokalink_dev_server_crypto_secret_32bytes_min!";
const PIN_PEPPER =
  process.env["PIN_PEPPER"] || "vokalink_dev_pin_pepper_secret_key_32bytes!";

const TEST_MENTOR_ID = "00000000-0000-0000-0000-000000000060";
const TEST_STUDENT_ID = "00000000-0000-0000-0000-000000000001";
const TEST_PLACEMENT_ID = "00000000-0000-0000-0000-000000000051";
const TEST_LOG_ID_1 = "00000000-0000-0000-0000-000000000101";
const TEST_LOG_ID_2 = "00000000-0000-0000-0000-000000000102";

const TEST_DEVICE_TOKEN = "test-device-token-32bytes-secret!";
const TEST_DEVICE_HASH = hashSha256Hex(TEST_DEVICE_TOKEN);
const TEST_PIN = "1234";
const TEST_PIN_SALT = "abcdef0123456789abcdef0123456789";
const TEST_PIN_HASH = hashPinWithScrypt(TEST_PIN, TEST_PIN_SALT, PIN_PEPPER);

const { mockPrisma } = vi.hoisted(() => {
  const mock: any = {
    signedLink: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    dudiMentor: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    placement: {
      findUnique: vi.fn(),
    },
    dailyLog: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    dailyLogItem: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    securityFlag: {
      create: vi.fn(),
    },
    driftAlert: {
      updateMany: vi.fn(),
    },
  };

  mock.$transaction = vi.fn(async (cb: any) => {
    if (typeof cb === "function") {
      return cb(mock);
    }
    return Promise.all(cb);
  });

  return { mockPrisma: mock };
});

vi.mock("../src/lib/prisma.js", () => {
  return {
    prisma: mockPrisma,
    createTenantPrisma: vi.fn(() => mockPrisma),
  };
});

describe("Dual-Mode Zero-Login Mentor Verification & Anti-Forgery Stamp (FR-007, BR-007)", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createTestToken(overrides?: Partial<Record<string, unknown>>): string {
    return createSignedToken(
      {
        rid: "link-123",
        mid: TEST_MENTOR_ID,
        pid: TEST_PLACEMENT_ID,
        lids: [TEST_LOG_ID_1, TEST_LOG_ID_2],
        p: "LOG_VERIFY",
        mode: "QR",
        exp: Math.floor(Date.now() / 1000) + 3600,
        ...overrides,
      },
      TEST_SECRET
    );
  }

  describe("1. GET /api/v1/verify/mentor/:token (Memuat Data Verifikasi)", () => {
    it("sukses memuat daftar log pending dengan token valid", async () => {
      const token = createTestToken();
      const tokenHash = hashSha256Hex(token);

      mockPrisma.signedLink.findUnique.mockResolvedValueOnce({
        id: "link-123",
        tokenHash,
        mentorId: TEST_MENTOR_ID,
        placementId: TEST_PLACEMENT_ID,
        logIds: [TEST_LOG_ID_1, TEST_LOG_ID_2],
        mode: "QR",
        expiresAt: new Date(Date.now() + 3600 * 1000),
        usedAt: null,
        revokedAt: null,
        mentor: {
          id: TEST_MENTOR_ID,
          fullName: "Rizky Firmansyah",
          jobTitle: "Lead Engineer",
          deviceTokenHash: TEST_DEVICE_HASH,
          lockedUntil: null,
          dudiPartner: { name: "PT Nusantara Tech" },
        },
      });

      mockPrisma.placement.findUnique.mockResolvedValueOnce({
        id: TEST_PLACEMENT_ID,
        student: {
          id: TEST_STUDENT_ID,
          fullName: "Andi Pratama",
          identityNumber: "0078901234",
          school: { name: "SMK Negeri 1 Surabaya" },
          schoolDepartment: { name: "Rekayasa Perangkat Lunak" },
        },
        dudiPartner: { name: "PT Nusantara Tech", city: "Surabaya" },
      });

      mockPrisma.dailyLog.findMany.mockResolvedValueOnce([
        {
          id: TEST_LOG_ID_1,
          clientLogUuid: "uuid-log-1",
          logDate: new Date("2026-10-20"),
          attendanceType: "PRESENT",
          shortNote: "Pengerjaan REST API",
          evidenceWebpUrl: "https://example.com/photo1.webp",
          items: [
            {
              id: "item-1",
              jobCardId: "jc-1",
              durationJp: 8,
              autonomyLevel: 3,
              jobCard: {
                title: "Implementasi REST API",
                skkniUnitCode: "J.620100.009.01",
                isNonCompetency: false,
              },
            },
          ],
        },
      ]);

      const res = await request(app).get(`/api/v1/verify/mentor/${token}`);

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.student.fullName).toBe("Andi Pratama");
      expect(res.body.mentor.fullName).toBe("Rizky Firmansyah");
      expect(res.body.logs.length).toBe(1);
      expect(res.body.nonce).toBeDefined();
    });

    it("menolak tautan yang sudah pernah digunakan (One-Time Link) dengan 410", async () => {
      const token = createTestToken();

      mockPrisma.signedLink.findUnique.mockResolvedValueOnce({
        id: "link-123",
        tokenHash: hashSha256Hex(token),
        usedAt: new Date(), // Already used
        mentor: { dudiPartner: { name: "PT Nusantara Tech" } },
      });

      const res = await request(app).get(`/api/v1/verify/mentor/${token}`);
      expect(res.status).toBe(410);
      expect(res.body.code).toBe("ALREADY_USED");
    });

    it("menolak token manipulasi kriptografi dengan 401", async () => {
      const invalidToken = "v1.invalidPayload.invalidSignature";
      const res = await request(app).get(`/api/v1/verify/mentor/${invalidToken}`);
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("INVALID_TOKEN");
    });
  });

  describe("2. POST /api/v1/verify/mentor/:token/check-device (Deteksi Perangkat Resmi)", () => {
    it("mengenali perangkat dengan device token yang cocok", async () => {
      const token = createTestToken();

      mockPrisma.signedLink.findUnique.mockResolvedValueOnce({
        mentor: { deviceTokenHash: TEST_DEVICE_HASH, lockedUntil: null },
      });

      const res = await request(app)
        .post(`/api/v1/verify/mentor/${token}/check-device`)
        .send({ deviceToken: TEST_DEVICE_TOKEN });

      expect(res.status).toBe(200);
      expect(res.body.recognized).toBe(true);
    });

    it("mendeteksi perangkat asing dan mencatat security flag (TC-006)", async () => {
      const token = createTestToken();

      mockPrisma.signedLink.findUnique.mockResolvedValueOnce({
        id: "link-123",
        placementId: TEST_PLACEMENT_ID,
        mentor: { id: TEST_MENTOR_ID, deviceTokenHash: TEST_DEVICE_HASH, lockedUntil: null },
      });

      const res = await request(app)
        .post(`/api/v1/verify/mentor/${token}/check-device`)
        .send({ deviceToken: "untrusted-random-device-token!" });

      expect(res.status).toBe(200);
      expect(res.body.recognized).toBe(false);
      expect(mockPrisma.securityFlag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            kind: "UNTRUSTED_DEVICE",
          }),
        })
      );
    });
  });

  describe("3. POST /api/v1/verify/mentor/:token/execute (Validasi 2-Faktor & Penyegelan HMAC)", () => {
    it("TC-006: menolak persetujuan jika device token tidak cocok (dibuka di HP siswa)", async () => {
      const token = createTestToken();

      mockPrisma.signedLink.findUnique.mockResolvedValueOnce({
        id: "link-123",
        expiresAt: new Date(Date.now() + 3600 * 1000),
        usedAt: null,
        revokedAt: null,
        placementId: TEST_PLACEMENT_ID,
        mentor: {
          id: TEST_MENTOR_ID,
          deviceTokenHash: TEST_DEVICE_HASH,
          lockedUntil: null,
        },
      });

      const res = await request(app)
        .post(`/api/v1/verify/mentor/${token}/execute`)
        .send({
          nonce: "nonce-12345",
          deviceToken: "alien-device-token-siswa!",
          pin: "1234",
          decision: "APPROVE",
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("DEVICE_MISMATCH");
      expect(mockPrisma.securityFlag.create).toHaveBeenCalled();
    });

    it("menolak persetujuan lintas DUDI jika perangkat milik mentor dari perusahaan/jurusan lain (403 CROSS_DUDI_MISMATCH)", async () => {
      const token = createTestToken();

      mockPrisma.signedLink.findUnique.mockResolvedValueOnce({
        id: "link-123",
        expiresAt: new Date(Date.now() + 3600 * 1000),
        usedAt: null,
        revokedAt: null,
        placementId: TEST_PLACEMENT_ID,
        mentor: {
          id: TEST_MENTOR_ID,
          deviceTokenHash: TEST_DEVICE_HASH,
          lockedUntil: null,
        },
      });

      mockPrisma.dudiMentor.findFirst.mockResolvedValueOnce({
        id: "00000000-0000-0000-0000-000000000099",
        fullName: "Mentor Akuntansi KAP",
        dudiPartner: { name: "KAP Drs. Bambang & Rekan" },
      });

      const res = await request(app)
        .post(`/api/v1/verify/mentor/${token}/execute`)
        .send({
          nonce: "nonce-12345",
          deviceToken: "other-mentor-device-token-from-kap!",
          pin: "1234",
          decision: "APPROVE",
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("CROSS_DUDI_MISMATCH");
      expect(res.body.detail).toContain("KAP Drs. Bambang & Rekan");
      expect(mockPrisma.securityFlag.create).toHaveBeenCalled();
    });

    it("TC-007: salah PIN 5 kali berturut-turut mengunci verifikasi selama 15 menit", async () => {
      const token = createTestToken();

      mockPrisma.signedLink.findUnique.mockResolvedValueOnce({
        id: "link-123",
        expiresAt: new Date(Date.now() + 3600 * 1000),
        usedAt: null,
        revokedAt: null,
        placementId: TEST_PLACEMENT_ID,
        mentor: {
          id: TEST_MENTOR_ID,
          deviceTokenHash: TEST_DEVICE_HASH,
          pinHash: TEST_PIN_HASH,
          pinSalt: TEST_PIN_SALT,
          failedPinAttempts: 4, // 5th attempt will lock
          lockedUntil: null,
        },
      });

      const res = await request(app)
        .post(`/api/v1/verify/mentor/${token}/execute`)
        .send({
          nonce: "nonce-12345",
          deviceToken: TEST_DEVICE_TOKEN,
          pin: "9999", // wrong PIN
          decision: "APPROVE",
        });

      expect(res.status).toBe(423);
      expect(res.body.code).toBe("PIN_LOCKOUT");
      expect(mockPrisma.dudiMentor.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedPinAttempts: 5,
            lockedUntil: expect.any(Date),
          }),
        })
      );
    });

    it("TC-005: sukses menyetujui logbook (Batch Approve < 10 dtk) dan menyegel HMAC-SHA256", async () => {
      const token = createTestToken();

      mockPrisma.signedLink.findUnique.mockResolvedValueOnce({
        id: "link-123",
        expiresAt: new Date(Date.now() + 3600 * 1000),
        usedAt: null,
        revokedAt: null,
        placementId: TEST_PLACEMENT_ID,
        logIds: [TEST_LOG_ID_1],
        mentor: {
          id: TEST_MENTOR_ID,
          deviceTokenHash: TEST_DEVICE_HASH,
          pinHash: TEST_PIN_HASH,
          pinSalt: TEST_PIN_SALT,
          failedPinAttempts: 0,
          lockedUntil: null,
        },
      });

      mockPrisma.dailyLog.findMany.mockResolvedValueOnce([
        {
          id: TEST_LOG_ID_1,
          clientLogUuid: "uuid-log-1",
          placementId: TEST_PLACEMENT_ID,
          studentId: TEST_STUDENT_ID,
          logDate: new Date("2026-10-20"),
          evidenceSha256: "a".repeat(64),
          items: [
            {
              id: "item-1",
              jobCardId: "00000000-0000-0000-0000-000000000031",
              durationJp: 8,
              autonomyLevel: 3,
            },
          ],
        },
      ]);

      mockPrisma.dailyLogItem.findMany.mockResolvedValueOnce([
        {
          id: "item-1",
          jobCardId: "00000000-0000-0000-0000-000000000031",
          durationJp: 8,
          autonomyLevel: 3,
        },
      ]);

      const res = await request(app)
        .post(`/api/v1/verify/mentor/${token}/execute`)
        .send({
          nonce: "nonce-12345",
          deviceToken: TEST_DEVICE_TOKEN,
          pin: TEST_PIN,
          decision: "APPROVE",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.decision).toBe("APPROVE");
      expect(res.body.processedCount).toBe(1);

      // Verify DB transaction
      expect(mockPrisma.signedLink.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "link-123" },
          data: expect.objectContaining({ usedAt: expect.any(Date) }),
        })
      );

      expect(mockPrisma.dailyLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: TEST_LOG_ID_1 },
          data: expect.objectContaining({
            status: "VERIFIED",
            signatureHash: expect.any(String),
          }),
        })
      );
    });
  });

  describe("4. POST /api/v1/verify/links (Pembangkitan Tautan QR / WhatsApp)", () => {
    it("menghasilkan tautan verifikasi dinamis dengan masa kedaluwarsa sesuai mode", async () => {
      mockPrisma.placement.findUnique.mockResolvedValueOnce({
        id: TEST_PLACEMENT_ID,
        dudiMentorId: TEST_MENTOR_ID,
        student: { fullName: "Andi Pratama" },
        dudiPartner: { name: "PT Nusantara Tech" },
        dudiMentor: {
          id: TEST_MENTOR_ID,
          fullName: "Rizky Firmansyah",
          jobTitle: "Lead Engineer",
          whatsappNumber: "081234567890",
        },
      });

      mockPrisma.dailyLog.findMany.mockResolvedValueOnce([
        { id: TEST_LOG_ID_1 },
        { id: TEST_LOG_ID_2 },
      ]);

      mockPrisma.signedLink.create.mockResolvedValueOnce({
        id: "new-link-id",
      });

      const res = await request(app)
        .post("/api/v1/verify/links")
        .send({
          placementId: TEST_PLACEMENT_ID,
          mode: "WA_BATCH",
        });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.verificationUrl).toContain("/v/");
      expect(res.body.waShareUrl).toContain("https://wa.me/6281234567890");
      expect(res.body.pendingCount).toBe(2);
    });
  });
});

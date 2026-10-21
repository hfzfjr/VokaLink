import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import {
  createSignedToken,
  hashSha256Hex,
} from "@vokalink/core";

const TEST_SCHOOL_ID = "00000000-0000-0000-0000-000000000002";
const TEST_DUDI_ID = "00000000-0000-0000-0000-000000000050";
const TEST_MENTOR_ID = "00000000-0000-0000-0000-000000000060";
const TEST_JC_1 = "00000000-0000-0000-0000-000000000071";
const TEST_JC_2 = "00000000-0000-0000-0000-000000000072";

const mockPartner = {
  id: TEST_DUDI_ID,
  createdBySchoolId: TEST_SCHOOL_ID,
  name: "PT Teknologi Inovasi Mandiri",
  sectorCategory: "Teknologi Informasi & Software",
  address: "Jl. Industri Modern No. 42",
  city: "Surabaya",
  latitude: -7.2575,
  longitude: 112.7521,
  maxQuota: 5,
  qualityIndexScore: 92.5,
  _count: { mentors: 1, capabilities: 2, placements: 3 },
  mentors: [
    {
      id: TEST_MENTOR_ID,
      fullName: "Budi Santoso, S.Kom",
      jobTitle: "Senior Lead Engineer",
      whatsappNumber: "081234567890",
      tokenBoundAt: null,
    },
  ],
  capabilities: [
    {
      jobCard: {
        id: TEST_JC_1,
        title: "Pembuatan REST API",
        skkniUnitCode: "J.620100.004.01",
        toolsAndSoftware: ["Node.js", "Express"],
        isNonCompetency: false,
        cpElement: { id: "cp-1", code: "RPL-CP-01", title: "Backend" },
      },
    },
    {
      jobCard: {
        id: TEST_JC_2,
        title: "Testing & Quality Assurance",
        skkniUnitCode: null,
        toolsAndSoftware: ["Vitest"],
        isNonCompetency: false,
        cpElement: { id: "cp-2", code: "RPL-CP-02", title: "QA" },
      },
    },
  ],
};

const { mockPrisma } = vi.hoisted(() => {
  const mock: any = {
    dudiPartner: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    dudiCapability: {
      createMany: vi.fn(),
    },
    dudiMentor: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    signedLink: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    jobCard: {
      findMany: vi.fn(),
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

describe("Assisted DUDI Onboarding & Mentor Device Binding (FR-003)", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env["NODE_ENV"] = "test";
    process.env["SUPABASE_JWT_SECRET"] = ""; // Trigger test mock auth
  });

  describe("GET /api/dudi (Direktori Terfederasi Lintas Sekolah BR-011)", () => {
    it("harus menolak request tanpa token auth (401)", async () => {
      const res = await request(app).get("/api/dudi");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("harus menampilkan daftar DUDI terfederasi (200)", async () => {
      mockPrisma.dudiPartner.findMany.mockResolvedValue([mockPartner]);

      const res = await request(app)
        .get("/api/dudi?city=Surabaya")
        .set("Authorization", "Bearer mock-token");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].name).toBe("PT Teknologi Inovasi Mandiri");
      expect(res.body.data[0].mentorsCount).toBe(1);
      expect(res.body.data[0].capabilitiesCount).toBe(2);
    });
  });

  describe("POST /api/dudi (Pendaftaran DUDI & Pemetaan Kapasitas)", () => {
    it("harus menolak jika tidak ada Job Card yang dipilih (422)", async () => {
      const res = await request(app)
        .post("/api/dudi")
        .set("Authorization", "Bearer mock-token")
        .send({
          name: "Studio Desain Kreatif",
          sectorCategory: "Desain Komunikasi Visual",
          address: "Jl. Pemuda No. 1",
          city: "Surabaya",
          latitude: -7.26,
          longitude: 112.75,
          maxQuota: 3,
          supportedJobCardIds: [], // Kosong!
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.detail).toContain("Pilih minimal 1 pekerjaan teknis");
    });

    it("harus berhasil mendaftarkan DUDI dan mapping Job Cards (201)", async () => {
      mockPrisma.jobCard.findMany.mockResolvedValue([
        { id: TEST_JC_1 },
        { id: TEST_JC_2 },
      ]);
      mockPrisma.dudiPartner.create.mockResolvedValue({
        id: TEST_DUDI_ID,
        name: "Studio Desain Kreatif",
        city: "Surabaya",
      });
      mockPrisma.dudiCapability.createMany.mockResolvedValue({ count: 2 });

      const res = await request(app)
        .post("/api/dudi")
        .set("Authorization", "Bearer mock-token")
        .send({
          name: "Studio Desain Kreatif",
          sectorCategory: "Desain Komunikasi Visual",
          address: "Jl. Pemuda No. 1",
          city: "Surabaya",
          latitude: -7.26,
          longitude: 112.75,
          maxQuota: 3,
          supportedJobCardIds: [TEST_JC_1, TEST_JC_2],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(TEST_DUDI_ID);
      expect(res.body.data.supportedJobCardsCount).toBe(2);
    });
  });

  describe("POST /api/dudi/:dudiId/mentors (Pendaftaran Mentor & Link Aktivasi)", () => {
    it("harus menolak nomor WhatsApp yang tidak valid (422)", async () => {
      mockPrisma.dudiPartner.findUnique.mockResolvedValue({ id: TEST_DUDI_ID, name: "PT ABC" });

      const res = await request(app)
        .post(`/api/dudi/${TEST_DUDI_ID}/mentors`)
        .set("Authorization", "Bearer mock-token")
        .send({
          fullName: "Ahmad Mentor",
          jobTitle: "Supervisor",
          whatsappNumber: "12345", // Format salah
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.detail).toContain("Nomor WhatsApp tidak valid");
    });

    it("harus berhasil mendaftarkan mentor dan menerbitkan token aktivasi 72 jam (201)", async () => {
      mockPrisma.dudiPartner.findUnique.mockResolvedValue({ id: TEST_DUDI_ID, name: "PT ABC" });
      mockPrisma.dudiMentor.create.mockResolvedValue({
        id: TEST_MENTOR_ID,
        fullName: "Ahmad Mentor",
        jobTitle: "Supervisor",
        whatsappNumber: "081234567890",
      });
      mockPrisma.signedLink.create.mockResolvedValue({});

      const res = await request(app)
        .post(`/api/dudi/${TEST_DUDI_ID}/mentors`)
        .set("Authorization", "Bearer mock-token")
        .send({
          fullName: "Ahmad Mentor",
          jobTitle: "Supervisor",
          whatsappNumber: "081234567890",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.mentor.id).toBe(TEST_MENTOR_ID);
      expect(res.body.data.activation.token.startsWith("v1.")).toBe(true);
      expect(res.body.data.activation.whatsappLink).toContain("wa.me/6281234567890");
    });
  });

  describe("Aktivasi Perangkat Zero-Login (GET & POST /api/dudi/verify/:token/activate)", () => {
    const validSecret = "vokalink_dev_server_crypto_secret_32bytes_min!";
    const testLinkId = "123e4567-e89b-12d3-a456-426614174000";

    it("GET harus mengembalikan detail untuk direview mentor sebelum input PIN (200)", async () => {
      const expSeconds = Math.floor(Date.now() / 1000) + 3600;
      const token = createSignedToken(
        { rid: testLinkId, mid: TEST_MENTOR_ID, p: "DEVICE_ACTIVATION", exp: expSeconds },
        validSecret
      );
      const tokenHash = hashSha256Hex(token);

      mockPrisma.signedLink.findUnique.mockResolvedValue({
        id: testLinkId,
        purpose: "DEVICE_ACTIVATION",
        tokenHash,
        mentorId: TEST_MENTOR_ID,
        expiresAt: new Date(expSeconds * 1000),
        usedAt: null,
        revokedAt: null,
        mentor: {
          id: TEST_MENTOR_ID,
          fullName: "Budi Santoso",
          jobTitle: "Lead Engineer",
          dudiPartner: {
            id: TEST_DUDI_ID,
            name: "PT Teknologi Inovasi Mandiri",
            sectorCategory: "IT",
            city: "Surabaya",
            capabilities: [
              { jobCard: { id: TEST_JC_1, title: "REST API", toolsAndSoftware: ["Node.js"] } },
            ],
          },
        },
      });

      const res = await request(app).get(`/api/dudi/verify/${token}/activate`);
      expect(res.status).toBe(200);
      expect(res.body.data.mentor.fullName).toBe("Budi Santoso");
      expect(res.body.data.dudi.name).toBe("PT Teknologi Inovasi Mandiri");
      expect(res.body.data.supportedJobCards.length).toBe(1);
    });

    it("POST harus menolak jika PIN bukan 4 digit angka (422)", async () => {
      const res = await request(app)
        .post(`/api/dudi/verify/valid-length-token-32chars-min-xyz/activate`)
        .send({
          deviceToken: "my_device_token_secret_1234567890",
          pin: "12345", // 5 digit!
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.detail).toContain("PIN harus tepat 4 digit angka");
    });

    it("POST harus berhasil mengikat perangkat mentor dan meng-hash PIN dengan scrypt (200)", async () => {
      const expSeconds = Math.floor(Date.now() / 1000) + 3600;
      const token = createSignedToken(
        { rid: testLinkId, mid: TEST_MENTOR_ID, p: "DEVICE_ACTIVATION", exp: expSeconds },
        validSecret
      );
      const tokenHash = hashSha256Hex(token);

      mockPrisma.signedLink.findUnique.mockResolvedValue({
        id: testLinkId,
        purpose: "DEVICE_ACTIVATION",
        tokenHash,
        mentorId: TEST_MENTOR_ID,
        expiresAt: new Date(expSeconds * 1000),
        usedAt: null,
        revokedAt: null,
      });

      mockPrisma.signedLink.update.mockResolvedValue({});
      mockPrisma.dudiMentor.update.mockResolvedValue({});

      const res = await request(app)
        .post(`/api/dudi/verify/${token}/activate`)
        .send({
          deviceToken: "secure_random_device_token_from_browser_32bytes",
          pin: "7890",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.isDeviceBound).toBe(true);

      // Pastikan DB dipanggil dengan PIN hash scrypt dan deviceToken hash (bukan plaintext)
      expect(mockPrisma.dudiMentor.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pinHash: expect.any(String),
            pinSalt: expect.any(String),
            deviceTokenHash: expect.any(String),
          }),
        })
      );
    });

    it("POST harus menolak jika link aktivasi sudah pernah digunakan (410 ALREADY_USED)", async () => {
      const expSeconds = Math.floor(Date.now() / 1000) + 3600;
      const token = createSignedToken(
        { rid: testLinkId, mid: TEST_MENTOR_ID, p: "DEVICE_ACTIVATION", exp: expSeconds },
        validSecret
      );
      const tokenHash = hashSha256Hex(token);

      mockPrisma.signedLink.findUnique.mockResolvedValue({
        id: testLinkId,
        purpose: "DEVICE_ACTIVATION",
        tokenHash,
        mentorId: TEST_MENTOR_ID,
        expiresAt: new Date(expSeconds * 1000),
        usedAt: new Date(), // Sudah pernah dipakai!
        revokedAt: null,
      });

      const res = await request(app)
        .post(`/api/dudi/verify/${token}/activate`)
        .send({
          deviceToken: "secure_random_device_token_from_browser_32bytes",
          pin: "7890",
        });

      expect(res.status).toBe(410);
      expect(res.body.code).toBe("ALREADY_USED");
    });
  });

  describe("POST /api/dudi/mentors/:mentorId/reset-device (A2: Pergantian HP Mentor)", () => {
    it("harus berhasil mereset ikatan perangkat dan membuat tautan aktivasi baru (200)", async () => {
      mockPrisma.dudiMentor.findUnique.mockResolvedValue({
        id: TEST_MENTOR_ID,
        fullName: "Budi Santoso",
        dudiPartner: { name: "PT ABC" },
      });
      mockPrisma.signedLink.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.dudiMentor.update.mockResolvedValue({});
      mockPrisma.signedLink.create.mockResolvedValue({});

      const res = await request(app)
        .post(`/api/dudi/mentors/${TEST_MENTOR_ID}/reset-device`)
        .set("Authorization", "Bearer mock-token");

      expect(res.status).toBe(200);
      expect(res.body.data.activationToken.startsWith("v1.")).toBe(true);
      expect(res.body.data.activatePath).toContain("/v/");
    });
  });
});

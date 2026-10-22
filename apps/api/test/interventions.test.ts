import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const TEST_STUDENT_ID = "00000000-0000-0000-0000-000000000001";
const TEST_TEACHER_ID = "00000000-0000-0000-0000-000000000021";
const TEST_PERIOD_ID = "00000000-0000-0000-0000-000000000003";
const TEST_DUDI_A_ID = "00000000-0000-0000-0000-000000000051";
const TEST_DUDI_B_ID = "00000000-0000-0000-0000-000000000052";
const TEST_MENTOR_A_ID = "00000000-0000-0000-0000-000000000061";
const TEST_MENTOR_B_ID = "00000000-0000-0000-0000-000000000062";
const TEST_PLACEMENT_A_ID = "00000000-0000-0000-0000-000000000071";
const TEST_DRIFT_ALERT_ID = "00000000-0000-0000-0000-000000000081";

const mockPlacementA = {
  id: TEST_PLACEMENT_A_ID,
  academicPeriodId: TEST_PERIOD_ID,
  studentId: TEST_STUDENT_ID,
  teacherId: TEST_TEACHER_ID,
  dudiPartnerId: TEST_DUDI_A_ID,
  dudiMentorId: TEST_MENTOR_A_ID,
  compatibilityScore: 78.5,
  distanceKm: 4.2,
  requiresMidtermRotation: false,
  rotatedFromId: null,
  rotationSequence: 1,
  status: "ACTIVE",
  dudiPartner: {
    id: TEST_DUDI_A_ID,
    name: "Kantor Akuntan Publik A",
  },
  dailyLogs: [
    {
      id: "log-1",
      status: "VERIFIED",
      items: [{ durationJp: 380, jobCardId: "jc-1" }],
    },
  ],
};

const mockTargetDudiB = {
  id: TEST_DUDI_B_ID,
  name: "Koperasi Syariah B",
  maxQuota: 5,
  placements: [{ id: "existing-p1" }], // 1 of 5 used
  mentors: [
    {
      id: TEST_MENTOR_B_ID,
      fullName: "Hendra Wijaya, S.E.",
      whatsappNumber: "081234567899",
    },
  ],
};

const { mockPrisma } = vi.hoisted(() => {
  const mock: any = {
    $queryRaw: vi.fn(),
    userProfile: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    placement: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    dudiPartner: {
      findUnique: vi.fn(),
    },
    driftAlert: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    interventionLog: {
      create: vi.fn(),
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

describe("Smart Intervention Dispatcher & Mid-Term Cross-DUDI Rotation (FR-009 & TC-009)", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env["NODE_ENV"] = "test";
    process.env["DATABASE_URL"] = "postgresql://mock";
    mockPrisma.$queryRaw.mockResolvedValue([1]);
  });

  describe("1. POST /api/v1/interventions/draft", () => {
    it("menolak request jika UUID tidak valid (422 VALIDATION_ERROR)", async () => {
      const res = await request(app)
        .post("/api/v1/interventions/draft")
        .send({ studentId: "not-a-uuid", placementId: "not-a-uuid" });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("berhasil menyusun draf pesan koordinasi WhatsApp berbasis data (200)", async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        id: TEST_STUDENT_ID,
        fullName: "Bintang Ramadhan",
        school: { name: "SMK Negeri 1 Surabaya" },
        schoolDepartment: {
          name: "Rekayasa Perangkat Lunak",
          cpElements: [
            {
              id: "cp-1",
              title: "Pemrograman Web",
              jobCards: [{ title: "REST API CRUD" }],
            },
            {
              id: "cp-2",
              title: "Basis Data & Cloud",
              jobCards: [{ title: "PostgreSQL Migration" }],
            },
          ],
        },
      });

      mockPrisma.placement.findUnique.mockResolvedValue({
        id: TEST_PLACEMENT_A_ID,
        dudiPartner: { name: "PT Inovasi Digital Mandiri" },
        dudiMentor: {
          fullName: "Budi Santoso",
          jobTitle: "Senior Tech Lead",
          whatsappNumber: "081234567891",
        },
        teacher: { fullName: "Dra. Siti Rahayu, M.Pd" },
        dailyLogs: [],
      });

      const res = await request(app)
        .post("/api/v1/interventions/draft")
        .send({
          studentId: TEST_STUDENT_ID,
          placementId: TEST_PLACEMENT_A_ID,
          alertType: "NON_COMPETENCY_OVERLOAD",
        });

      expect(res.status).toBe(200);
      expect(res.body.messageText).toContain("Bintang Ramadhan");
      expect(res.body.messageText).toContain("Budi Santoso (Senior Tech Lead)");
      expect(res.body.messageText).toContain("PT Inovasi Digital Mandiri");
      expect(res.body.mentorPhone).toBe("6281234567891");
      expect(res.body.waLink).toContain("https://wa.me/6281234567891?text=");
    });
  });

  describe("2. POST /api/v1/interventions", () => {
    it("menolak request jika actionType tidak valid (422)", async () => {
      const res = await request(app)
        .post("/api/v1/interventions")
        .send({
          placementId: TEST_PLACEMENT_A_ID,
          studentId: TEST_STUDENT_ID,
          actionType: "INVALID_ACTION",
          messageSent: "Catatan intervensi",
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("berhasil mencatat log intervensi guru dan memperbarui status alert (201)", async () => {
      mockPrisma.interventionLog.create.mockResolvedValue({
        id: "intervention-1",
        driftAlertId: TEST_DRIFT_ALERT_ID,
        actionType: "WA_COORDINATION",
        messageSent: "Pesan koordinasi via WhatsApp terkirim ke mentor",
        createdAt: new Date(),
      });

      mockPrisma.driftAlert.update.mockResolvedValue({
        id: TEST_DRIFT_ALERT_ID,
        status: "INTERVENED",
      });

      const res = await request(app)
        .post("/api/v1/interventions")
        .send({
          driftAlertId: TEST_DRIFT_ALERT_ID,
          placementId: TEST_PLACEMENT_A_ID,
          studentId: TEST_STUDENT_ID,
          actionType: "WA_COORDINATION",
          messageSent: "Pesan koordinasi via WhatsApp terkirim ke mentor",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockPrisma.driftAlert.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: TEST_DRIFT_ALERT_ID },
          data: expect.objectContaining({ status: "INTERVENED" }),
        })
      );
    });
  });

  describe("3. POST /api/v1/placements/rotate & TC-009 (Rotasi Mitra DUDI Tengah Semester)", () => {
    it("menolak rotasi jika penempatan asal tidak ditemukan (404)", async () => {
      mockPrisma.placement.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/v1/placements/rotate")
        .send({
          studentId: TEST_STUDENT_ID,
          fromPlacementId: TEST_PLACEMENT_A_ID,
          toDudiId: TEST_DUDI_B_ID,
          reason: "Kebutuhan rotasi pemenuhan elemen kompetensi",
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("menolak rotasi jika ID siswa tidak cocok dengan penempatan (422 STUDENT_MISMATCH)", async () => {
      mockPrisma.placement.findUnique.mockResolvedValue({
        ...mockPlacementA,
        studentId: "00000000-0000-0000-0000-000000000099", // Different student
      });

      const res = await request(app)
        .post("/api/v1/placements/rotate")
        .send({
          studentId: TEST_STUDENT_ID,
          fromPlacementId: TEST_PLACEMENT_A_ID,
          toDudiId: TEST_DUDI_B_ID,
          reason: "Kebutuhan rotasi pemenuhan elemen kompetensi",
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("STUDENT_MISMATCH");
    });

    it("menolak rotasi jika kuota mitra DUDI tujuan sudah penuh (422 QUOTA_EXCEEDED)", async () => {
      mockPrisma.placement.findUnique.mockResolvedValue(mockPlacementA);
      mockPrisma.dudiPartner.findUnique.mockResolvedValue({
        ...mockTargetDudiB,
        maxQuota: 2,
        placements: [{ id: "p1" }, { id: "p2" }], // Kuota 2/2 penuh
      });

      const res = await request(app)
        .post("/api/v1/placements/rotate")
        .send({
          studentId: TEST_STUDENT_ID,
          fromPlacementId: TEST_PLACEMENT_A_ID,
          toDudiId: TEST_DUDI_B_ID,
          reason: "Kebutuhan rotasi pemenuhan elemen kompetensi",
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("QUOTA_EXCEEDED");
    });

    it("TC-009: Sukses mengeksekusi rotasi mitra dari DUDI A (380 JP) ke DUDI B dengan histori akumulasi utuh", async () => {
      mockPrisma.placement.findUnique.mockResolvedValue(mockPlacementA);
      mockPrisma.dudiPartner.findUnique.mockResolvedValue(mockTargetDudiB);

      const newPlacementCreated = {
        id: "00000000-0000-0000-0000-000000000072",
        academicPeriodId: TEST_PERIOD_ID,
        studentId: TEST_STUDENT_ID,
        teacherId: TEST_TEACHER_ID,
        dudiPartnerId: TEST_DUDI_B_ID,
        dudiMentorId: TEST_MENTOR_B_ID,
        rotatedFromId: TEST_PLACEMENT_A_ID,
        rotationSequence: 2,
        status: "ACTIVE",
        dudiPartner: { name: "Koperasi Syariah B" },
        dudiMentor: { fullName: "Hendra Wijaya, S.E." },
      };

      mockPrisma.placement.update.mockResolvedValue({
        ...mockPlacementA,
        status: "ROTATED_OUT",
      });
      mockPrisma.placement.create.mockResolvedValue(newPlacementCreated);
      mockPrisma.driftAlert.update.mockResolvedValue({
        id: TEST_DRIFT_ALERT_ID,
        status: "RESOLVED",
      });
      mockPrisma.interventionLog.create.mockResolvedValue({
        id: "log-rotasi-1",
        actionType: "DUDI_ROTATION",
      });

      const res = await request(app)
        .post("/api/v1/placements/rotate")
        .send({
          studentId: TEST_STUDENT_ID,
          fromPlacementId: TEST_PLACEMENT_A_ID,
          toDudiId: TEST_DUDI_B_ID,
          toMentorId: TEST_MENTOR_B_ID,
          driftAlertId: TEST_DRIFT_ALERT_ID,
          reason: "Pemenuhan CP Pajak & Rekonsiliasi di DUDI Kedua (TC-009)",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.previousPlacement.status).toBe("ROTATED_OUT");
      expect(res.body.previousPlacement.verifiedJp).toBe(380);
      expect(res.body.newPlacement.status).toBe("ACTIVE");
      expect(res.body.newPlacement.rotationSequence).toBe(2);
      expect(res.body.newPlacement.dudiName).toBe("Koperasi Syariah B");

      // Verifikasi alert drift otomatis di-resolve
      expect(mockPrisma.driftAlert.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "RESOLVED" }),
        })
      );
    });
  });

  describe("4. GET /api/v1/interventions", () => {
    it("berhasil memuat daftar riwayat intervensi guru (200)", async () => {
      mockPrisma.interventionLog.findMany.mockResolvedValue([
        {
          id: "int-1",
          actionType: "WA_COORDINATION",
          messageSent: "Pesan koordinasi terkirim",
          createdAt: new Date(),
          teacher: { fullName: "Dra. Siti Rahayu, M.Pd" },
          driftAlert: {
            alertType: "NON_COMPETENCY_OVERLOAD",
            student: { fullName: "Bintang Ramadhan" },
            placement: { dudiPartner: { name: "PT Inovasi Digital" } },
          },
        },
      ]);

      const res = await request(app).get("/api/v1/interventions");

      expect(res.status).toBe(200);
      expect(res.body.interventions.length).toBe(1);
      expect(res.body.interventions[0].studentName).toBe("Bintang Ramadhan");
      expect(res.body.interventions[0].actionType).toBe("WA_COORDINATION");
    });
  });
});

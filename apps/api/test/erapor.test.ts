import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const TEST_SCHOOL_ID = "00000000-0000-0000-0000-000000000002";
const TEST_PERIOD_ID = "00000000-0000-0000-0000-000000000003";
const TEST_STUDENT_ID = "00000000-0000-0000-0000-000000000020";
const TEST_TEACHER_ID = "00000000-0000-0000-0000-000000000021";
const TEST_DUDI_ID = "00000000-0000-0000-0000-000000000050";
const TEST_CP_1 = "00000000-0000-0000-0000-000000000071";

const mockSchool = {
  id: TEST_SCHOOL_ID,
  name: "SMK Negeri 1 Surabaya",
  city: "Surabaya",
};

const mockPeriod = {
  id: TEST_PERIOD_ID,
  schoolId: TEST_SCHOOL_ID,
  name: "PKL Genap 2025/2026",
  isActive: true,
};

const mockPlacement = {
  id: "placement-1",
  academicPeriodId: TEST_PERIOD_ID,
  studentId: TEST_STUDENT_ID,
  teacherId: TEST_TEACHER_ID,
  dudiPartnerId: TEST_DUDI_ID,
  student: {
    id: TEST_STUDENT_ID,
    fullName: "Ahmad Rizky Pratama",
    identityNumber: "0012345678",
    schoolDepartment: {
      id: "dept-1",
      name: "Rekayasa Perangkat Lunak",
      sectorCode: "RPL",
      cpElements: [
        { id: TEST_CP_1, code: "RPL-CP-01", title: "Pemrograman Web & Mobile", targetJp: 100 },
      ],
    },
  },
  dudiPartner: {
    id: TEST_DUDI_ID,
    name: "PT Inovasi Digital Nusantara",
    city: "Surabaya",
  },
  teacher: {
    id: TEST_TEACHER_ID,
    fullName: "Dra. Siti Rahayu, M.Pd",
    identityNumber: "198001012005012001",
  },
  endorsement: {
    attitudeScore: 90, // Mentor attitude
    endorsementQuote: "Sangat rajin dan kompeten.",
  },
  dailyLogs: [
    {
      id: "log-1",
      status: "VERIFIED", // Hanya yang VERIFIED yang dihitung
      items: [
        {
          jobCardId: "jc-1",
          durationJp: 50,
          autonomyLevel: 3, // Mandiri (100)
          jobCard: {
            id: "jc-1",
            title: "REST API Service",
            cpElementId: TEST_CP_1,
            isNonCompetency: false,
          },
        },
        {
          jobCardId: "jc-1",
          durationJp: 50,
          autonomyLevel: 2, // Terbimbing (88)
          jobCard: {
            id: "jc-1",
            title: "REST API Service",
            cpElementId: TEST_CP_1,
            isNonCompetency: false,
          },
        },
      ],
    },
    {
      id: "log-2",
      status: "PENDING_VERIFICATION", // Menunggu verifikasi
      items: [
        {
          jobCardId: "jc-2",
          durationJp: 8,
          autonomyLevel: 1,
          jobCard: {
            id: "jc-2",
            title: "Testing QA",
            cpElementId: TEST_CP_1,
            isNonCompetency: false,
          },
        },
      ],
    },
  ],
};

const { mockPrisma } = vi.hoisted(() => {
  const mock: any = {
    school: { findUnique: vi.fn() },
    academicPeriod: { findFirst: vi.fn() },
    placement: { findMany: vi.fn() },
  };
  return { mockPrisma: mock };
});

vi.mock("../src/lib/prisma.js", () => {
  return {
    prisma: mockPrisma,
    createTenantPrisma: vi.fn(() => mockPrisma),
  };
});

describe("Automated e-Rapor SMK Grade & Narrative Exporter (FR-011)", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env["NODE_ENV"] = "test";
    process.env["SUPABASE_JWT_SECRET"] = ""; // Mock auth
  });

  describe("GET /api/schools/:schoolId/erapor", () => {
    it("harus menolak request tanpa token auth (401)", async () => {
      const res = await request(app).get(`/api/schools/${TEST_SCHOOL_ID}/erapor`);
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("harus menolak jika tenant schoolId tidak cocok (403)", async () => {
      const res = await request(app)
        .get(`/api/schools/wrong-school/erapor`)
        .set("Authorization", "Bearer mock-token");
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("harus berhasil menghitung nilai akhir e-Rapor & mendeteksi peringatan log pending (200 JSON)", async () => {
      mockPrisma.school.findUnique.mockResolvedValue(mockSchool);
      mockPrisma.academicPeriod.findFirst.mockResolvedValue(mockPeriod);
      mockPrisma.placement.findMany.mockResolvedValue([mockPlacement]);

      const res = await request(app)
        .get(`/api/schools/${TEST_SCHOOL_ID}/erapor`)
        .set("Authorization", "Bearer mock-token");

      expect(res.status).toBe(200);
      expect(res.body.data.records.length).toBe(1);

      const record = res.body.data.records[0];
      expect(record.student.fullName).toBe("Ahmad Rizky Pratama");
      expect(record.student.identityNumber).toBe("0012345678");
      expect(record.dudiPartner.name).toBe("PT Inovasi Digital Nusantara");

      // Verifikasi perhitungan nilai teknis:
      // Target = 100 JP, Verified = 100 JP (100% * 0.60 = 60)
      // Autonomy avg: (50*100 + 50*88) / 100 = 94. 94 * 0.40 = 37.6
      // Technical = 97.6. Attitude = 90.
      // Final = 97.6 * 0.80 + 90 * 0.20 = 78.08 + 18 = 96.08
      expect(record.totalVerifiedJp).toBe(100);
      expect(record.elements[0].score).toBe(97.6);
      expect(record.finalGrade).toBe(96.08);

      // Verifikasi narasi Kurikulum Merdeka
      expect(record.highestAchievement).toContain("REST API Service");
      expect(record.highestAchievement).toContain("PT Inovasi Digital Nusantara");

      // Verifikasi deteksi log PENDING_VERIFICATION
      expect(record.pendingLogsCount).toBe(1);
      expect(res.body.data.studentsWithPendingLogsCount).toBe(1);
      expect(res.body.data.warningMessage).toContain("Terdapat 1 siswa yang masih memiliki jurnal belum divalidasi");
    });

    it("harus menghasilkan file download CSV e-Rapor siap impor (format=csv)", async () => {
      mockPrisma.school.findUnique.mockResolvedValue(mockSchool);
      mockPrisma.academicPeriod.findFirst.mockResolvedValue(mockPeriod);
      mockPrisma.placement.findMany.mockResolvedValue([mockPlacement]);

      const res = await request(app)
        .get(`/api/schools/${TEST_SCHOOL_ID}/erapor?format=csv`)
        .set("Authorization", "Bearer mock-token");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.headers["content-disposition"]).toContain("attachment; filename=");

      const csv = res.text;
      expect(csv).toContain("NISN,Nama_Siswa,Nama_Mitra_DUDI,Total_JP_Terverifikasi,Nilai_Akhir_PKL");
      expect(csv).toContain("0012345678");
      expect(csv).toContain("Ahmad Rizky Pratama");
      expect(csv).toContain("PT Inovasi Digital Nusantara");
      expect(csv).toContain("96.08");
    });
  });
});

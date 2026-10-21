import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const TEST_SCHOOL_ID = "00000000-0000-0000-0000-000000000002";
const TEST_PERIOD_ID = "00000000-0000-0000-0000-000000000003";
const TEST_DEPT_ID = "00000000-0000-0000-0000-000000000010";
const TEST_STUDENT_ID = "00000000-0000-0000-0000-000000000020";
const TEST_TEACHER_ID = "00000000-0000-0000-0000-000000000021";
const TEST_DUDI_ID = "00000000-0000-0000-0000-000000000050";
const TEST_CP_1 = "00000000-0000-0000-0000-000000000071";
const TEST_CP_2 = "00000000-0000-0000-0000-000000000072";

const mockSchool = {
  id: TEST_SCHOOL_ID,
  name: "SMK Negeri 1 Surabaya",
  latitude: -7.2575,
  longitude: 112.7521,
};

const mockPeriod = {
  id: TEST_PERIOD_ID,
  schoolId: TEST_SCHOOL_ID,
  name: "PKL Genap 2025/2026",
  targetTotalJp: 792,
  isActive: true,
};

const mockStudent = {
  id: TEST_STUDENT_ID,
  schoolId: TEST_SCHOOL_ID,
  schoolDepartmentId: TEST_DEPT_ID,
  role: "STUDENT",
  fullName: "Ahmad Rizky Pratama",
  identityNumber: "0012345678",
  homeLatitude: -7.2600,
  homeLongitude: 112.7530,
  school: mockSchool,
  schoolDepartment: {
    id: TEST_DEPT_ID,
    name: "Rekayasa Perangkat Lunak",
    sectorCode: "RPL",
    cpElements: [
      { id: TEST_CP_1, code: "RPL-CP-01", title: "Pemrograman Web & Mobile", targetJp: 450 },
      { id: TEST_CP_2, code: "RPL-CP-02", title: "Basis Data & Cloud", targetJp: 342 },
    ],
  },
  studentPlacements: [],
};

const mockTeacher = {
  id: TEST_TEACHER_ID,
  schoolId: TEST_SCHOOL_ID,
  role: "TEACHER",
  fullName: "Dra. Siti Rahayu, M.Pd",
  identityNumber: "198001012005012001",
};

const mockDudi = {
  id: TEST_DUDI_ID,
  name: "PT Inovasi Digital Nusantara",
  sectorCategory: "Teknologi Informasi & Software",
  address: "Jl. Pemuda No. 45",
  city: "Surabaya",
  latitude: -7.2625,
  longitude: 112.7483,
  maxQuota: 5,
  capabilities: [
    {
      jobCard: {
        id: "jc-1",
        title: "REST API",
        cpElementId: TEST_CP_1, // Hanya mendukung CP 1 (450 JP dari 792 JP = 56.8%)
        isNonCompetency: false,
      },
    },
  ],
  placements: [],
  mentors: [],
};

const { mockPrisma } = vi.hoisted(() => {
  const mock: any = {
    school: { findUnique: vi.fn() },
    academicPeriod: { findFirst: vi.fn() },
    userProfile: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    dudiPartner: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    dudiMentor: {
      findFirst: vi.fn(),
    },
    placement: {
      findMany: vi.fn(),
      create: vi.fn(),
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

describe("Smart Placement & Spatial Compatibility Scorer (FR-004)", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env["NODE_ENV"] = "test";
    process.env["SUPABASE_JWT_SECRET"] = ""; // Mock auth
  });

  describe("GET /api/schools/:schoolId/placements/candidates", () => {
    it("harus menolak request tanpa token auth (401)", async () => {
      const res = await request(app).get(
        `/api/schools/${TEST_SCHOOL_ID}/placements/candidates`
      );
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("harus menolak jika tenant schoolId tidak cocok dengan token (403)", async () => {
      const res = await request(app)
        .get(`/api/schools/other-school-id/placements/candidates`)
        .set("Authorization", "Bearer mock-token");

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("harus berhasil menghitung skor rekomendasi DUDI untuk siswa (200)", async () => {
      mockPrisma.school.findUnique.mockResolvedValue(mockSchool);
      mockPrisma.academicPeriod.findFirst.mockResolvedValue(mockPeriod);
      mockPrisma.userProfile.findMany
        .mockResolvedValueOnce([mockStudent]) // students
        .mockResolvedValueOnce([mockTeacher]); // teachers
      mockPrisma.dudiPartner.findMany.mockResolvedValue([mockDudi]);

      const res = await request(app)
        .get(`/api/schools/${TEST_SCHOOL_ID}/placements/candidates`)
        .set("Authorization", "Bearer mock-token");

      expect(res.status).toBe(200);
      expect(res.body.data.students.length).toBe(1);

      const candidate = res.body.data.students[0];
      expect(candidate.fullName).toBe("Ahmad Rizky Pratama");
      expect(candidate.isPlaced).toBe(false);
      expect(candidate.recommendations.length).toBe(1);

      const rec = candidate.recommendations[0];
      expect(rec.dudiName).toBe("PT Inovasi Digital Nusantara");
      expect(rec.distanceKm).toBeLessThan(5); // Jarak sangat dekat (< 5km)
      expect(rec.distanceScore).toBe(100);
      expect(rec.competencyScore).toBeGreaterThan(50); // 450/792 = ~56.82%
      expect(rec.requiresMidtermRotation).toBe(false);
      expect(rec.totalScore).toBeGreaterThan(60);
    });
  });

  describe("POST /api/schools/:schoolId/placements", () => {
    it("harus menolak jika kuota DUDI penuh dan tanpa alasan override (422 QUOTA_EXCEEDED)", async () => {
      mockPrisma.academicPeriod.findFirst.mockResolvedValue(mockPeriod);
      mockPrisma.userProfile.findFirst
        .mockResolvedValueOnce(mockStudent) // student
        .mockResolvedValueOnce(mockTeacher); // teacher

      // DUDI kuota penuh (5 dari maxQuota 5)
      mockPrisma.dudiPartner.findUnique.mockResolvedValue({
        ...mockDudi,
        maxQuota: 5,
        placements: [{ id: "p1" }, { id: "p2" }, { id: "p3" }, { id: "p4" }, { id: "p5" }],
      });

      const res = await request(app)
        .post(`/api/schools/${TEST_SCHOOL_ID}/placements`)
        .set("Authorization", "Bearer mock-token")
        .send({
          studentId: TEST_STUDENT_ID,
          dudiPartnerId: TEST_DUDI_ID,
          teacherId: TEST_TEACHER_ID,
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("QUOTA_EXCEEDED");
      expect(res.body.detail).toContain("sudah penuh");
    });

    it("harus mengizinkan penempatan jika disertai alasan override A1 saat kuota penuh (201)", async () => {
      mockPrisma.academicPeriod.findFirst.mockResolvedValue(mockPeriod);
      mockPrisma.userProfile.findFirst
        .mockResolvedValueOnce(mockStudent)
        .mockResolvedValueOnce(mockTeacher);

      mockPrisma.dudiPartner.findUnique.mockResolvedValue({
        ...mockDudi,
        maxQuota: 1,
        placements: [{ id: "p1" }], // Penuh
      });

      mockPrisma.placement.create.mockResolvedValue({
        id: "new-placement-id",
        student: { id: TEST_STUDENT_ID, fullName: "Ahmad Rizky Pratama" },
        teacher: { id: TEST_TEACHER_ID, fullName: "Dra. Siti Rahayu, M.Pd" },
        dudiPartner: { id: TEST_DUDI_ID, name: "PT Inovasi Digital Nusantara" },
      });

      const res = await request(app)
        .post(`/api/schools/${TEST_SCHOOL_ID}/placements`)
        .set("Authorization", "Bearer mock-token")
        .send({
          studentId: TEST_STUDENT_ID,
          dudiPartnerId: TEST_DUDI_ID,
          teacherId: TEST_TEACHER_ID,
          overrideReason: "Surat persetujuan khusus penambahan kuota dari pimpinan industri",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe("new-placement-id");
    });

    it("harus berhasil menempatkan siswa dan mendeteksi jika wajib rotasi tengah semester (201)", async () => {
      mockPrisma.academicPeriod.findFirst.mockResolvedValue(mockPeriod);
      mockPrisma.userProfile.findFirst
        .mockResolvedValueOnce(mockStudent)
        .mockResolvedValueOnce(mockTeacher);

      // DUDI dengan cakupan kompetensi rendah (hanya Job Card non-kompetensi / 0 JP CP)
      mockPrisma.dudiPartner.findUnique.mockResolvedValue({
        ...mockDudi,
        capabilities: [], // 0 CP didukung! (< 50%)
        placements: [],
      });

      mockPrisma.placement.create.mockResolvedValue({
        id: "placement-low-coverage",
        student: { id: TEST_STUDENT_ID, fullName: "Ahmad Rizky Pratama" },
        teacher: { id: TEST_TEACHER_ID, fullName: "Dra. Siti Rahayu, M.Pd" },
        dudiPartner: { id: TEST_DUDI_ID, name: "PT Inovasi Digital Nusantara" },
      });

      const res = await request(app)
        .post(`/api/schools/${TEST_SCHOOL_ID}/placements`)
        .set("Authorization", "Bearer mock-token")
        .send({
          studentId: TEST_STUDENT_ID,
          dudiPartnerId: TEST_DUDI_ID,
          teacherId: TEST_TEACHER_ID,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.scores.competencyScore).toBe(0);
      expect(res.body.data.scores.requiresMidtermRotation).toBe(true);
    });

    it("harus menolak jika siswa sudah memiliki penempatan aktif di periode yang sama (409)", async () => {
      mockPrisma.academicPeriod.findFirst.mockResolvedValue(mockPeriod);
      mockPrisma.userProfile.findFirst.mockResolvedValueOnce({
        ...mockStudent,
        studentPlacements: [{ id: "existing-placement-id", status: "ACTIVE" }],
      });

      const res = await request(app)
        .post(`/api/schools/${TEST_SCHOOL_ID}/placements`)
        .set("Authorization", "Bearer mock-token")
        .send({
          studentId: TEST_STUDENT_ID,
          dudiPartnerId: TEST_DUDI_ID,
          teacherId: TEST_TEACHER_ID,
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("ALREADY_PLACED");
    });
  });

  describe("PATCH /api/schools/:schoolId/placements/students/:studentId/coordinates", () => {
    it("harus berhasil mengupdate koordinat domisili siswa (200)", async () => {
      mockPrisma.userProfile.findFirst.mockResolvedValue(mockStudent);
      mockPrisma.userProfile.update.mockResolvedValue({
        id: TEST_STUDENT_ID,
        fullName: "Ahmad Rizky Pratama",
        homeLatitude: -7.2800,
        homeLongitude: 112.7600,
      });

      const res = await request(app)
        .patch(
          `/api/schools/${TEST_SCHOOL_ID}/placements/students/${TEST_STUDENT_ID}/coordinates`
        )
        .set("Authorization", "Bearer mock-token")
        .send({
          homeLatitude: -7.2800,
          homeLongitude: 112.7600,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.homeLatitude).toBe(-7.28);
      expect(res.body.data.homeLongitude).toBe(112.76);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const TEST_SCHOOL_ID = "00000000-0000-0000-0000-000000000002";
const TEST_DEPT_ID = "00000000-0000-0000-0000-000000000010";

const CP_1_ID = "00000000-0000-0000-0000-000000000021";
const CP_2_ID = "00000000-0000-0000-0000-000000000022";
const CP_3_ID = "00000000-0000-0000-0000-000000000023";

// Dummy CP Elements & Job Cards
const mockElements = [
  { id: CP_1_ID, code: "RPL-CP-01", title: "Pemrograman Web & Mobile", targetJp: 300, sortOrder: 1 },
  { id: CP_2_ID, code: "RPL-CP-02", title: "Basis Data & Cloud", targetJp: 250, sortOrder: 2 },
  { id: CP_3_ID, code: "RPL-CP-03", title: "Testing & Quality Assurance", targetJp: 242, sortOrder: 3 },
];

const mockJobCards = [
  { id: "00000000-0000-0000-0000-000000000031", cpElementId: CP_1_ID, title: "Implementasi REST API CRUD", isNonCompetency: false },
  { id: "00000000-0000-0000-0000-000000000032", cpElementId: CP_1_ID, title: "Slicing UI Responsif Tailwind", isNonCompetency: false },
  { id: "00000000-0000-0000-0000-000000000033", cpElementId: CP_2_ID, title: "Query Optimasi & Migrasi", isNonCompetency: false },
  { id: "00000000-0000-0000-0000-000000000034", cpElementId: CP_2_ID, title: "Setup Database & Indexing", isNonCompetency: false },
  { id: "00000000-0000-0000-0000-000000000035", cpElementId: CP_3_ID, title: "Unit Testing & Integration Test", isNonCompetency: false },
  { id: "00000000-0000-0000-0000-000000000036", cpElementId: CP_3_ID, title: "Bug Reporting & Reproduce", isNonCompetency: false },
  { id: "00000000-0000-0000-0000-000000000037", cpElementId: null, title: "Bantuan Operasional Umum", isNonCompetency: true },
];

const mockDept = {
  id: TEST_DEPT_ID,
  schoolId: TEST_SCHOOL_ID,
  sectorCode: "RPL",
  name: "Rekayasa Perangkat Lunak",
  isLocked: false,
  cpElements: mockElements,
  jobCards: mockJobCards,
};

const mockPeriod = {
  id: "period-1",
  schoolId: TEST_SCHOOL_ID,
  name: "Semester Genap 2025/2026",
  targetTotalJp: 792,
  isActive: true,
};

const mockTenantPrisma = {
  schoolDepartment: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  academicPeriod: {
    findFirst: vi.fn(),
  },
  cpElement: {
    update: vi.fn(),
  },
  jobCard: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  dailyLogItem: {
    count: vi.fn(),
  },
  $transaction: vi.fn(async (ops: any) => {
    if (Array.isArray(ops)) {
      return Promise.all(ops);
    }
    return ops(mockTenantPrisma);
  }),
};

vi.mock("../src/lib/prisma.js", () => {
  return {
    prisma: {},
    createTenantPrisma: vi.fn(() => mockTenantPrisma),
  };
});

describe("Curriculum & Job Card Mapper (FR-002)", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env["NODE_ENV"] = "test";
    process.env["SUPABASE_JWT_SECRET"] = ""; // Trigger test mock in auth middleware

    mockTenantPrisma.schoolDepartment.findFirst.mockResolvedValue({ ...mockDept, isLocked: false });
    mockTenantPrisma.academicPeriod.findFirst.mockResolvedValue(mockPeriod);
  });

  describe("GET /api/schools/:schoolId/departments/:deptId/curriculum", () => {
    it("harus menolak request tanpa otentikasi (401)", async () => {
      const res = await request(app).get(
        `/api/schools/${TEST_SCHOOL_ID}/departments/${TEST_DEPT_ID}/curriculum`
      );
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("harus menolak akses jika schoolId path tidak sama dengan token (403)", async () => {
      const diffSchoolId = "11111111-1111-1111-1111-111111111111";
      const res = await request(app)
        .get(`/api/schools/${diffSchoolId}/departments/${TEST_DEPT_ID}/curriculum`)
        .set("Authorization", "Bearer mock-token");

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("harus berhasil menampilkan matriks kurikulum dengan 792 JP (200)", async () => {
      const res = await request(app)
        .get(`/api/schools/${TEST_SCHOOL_ID}/departments/${TEST_DEPT_ID}/curriculum`)
        .set("Authorization", "Bearer mock-token");

      expect(res.status).toBe(200);
      expect(res.body.data.currentTotalJp).toBe(792);
      expect(res.body.data.jpDelta).toBe(0);
      expect(res.body.data.elements.length).toBe(3);
      expect(res.body.data.nonCompetencyCards.length).toBe(1);
    });
  });

  describe("PUT /api/schools/:schoolId/departments/:deptId/curriculum (Update Bobot JP)", () => {
    it("TC-002: harus menolak jika total alokasi JP tidak sama dengan target (422 JP_TOTAL_MISMATCH)", async () => {
      const res = await request(app)
        .put(`/api/schools/${TEST_SCHOOL_ID}/departments/${TEST_DEPT_ID}/curriculum`)
        .set("Authorization", "Bearer mock-token")
        .send({
          elements: [
            { id: CP_1_ID, targetJp: 300 },
            { id: CP_2_ID, targetJp: 250 },
            { id: CP_3_ID, targetJp: 200 }, // Total 750 JP, kurang 42 JP
          ],
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("JP_TOTAL_MISMATCH");
      expect(res.body.detail).toContain("Kurang 42 JP dari target 792 JP");
    });

    it("harus berhasil mengupdate bobot JP bila total tepat 792 JP (200)", async () => {
      mockTenantPrisma.cpElement.update.mockResolvedValue({});

      const res = await request(app)
        .put(`/api/schools/${TEST_SCHOOL_ID}/departments/${TEST_DEPT_ID}/curriculum`)
        .set("Authorization", "Bearer mock-token")
        .send({
          elements: [
            { id: CP_1_ID, targetJp: 300 },
            { id: CP_2_ID, targetJp: 250 },
            { id: CP_3_ID, targetJp: 242 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.totalJp).toBe(792);
    });

    it("harus menolak jika kurikulum sudah terkunci (409)", async () => {
      mockTenantPrisma.schoolDepartment.findFirst.mockResolvedValue({
        ...mockDept,
        isLocked: true,
      });

      const res = await request(app)
        .put(`/api/schools/${TEST_SCHOOL_ID}/departments/${TEST_DEPT_ID}/curriculum`)
        .set("Authorization", "Bearer mock-token")
        .send({
          elements: [
            { id: CP_1_ID, targetJp: 300 },
            { id: CP_2_ID, targetJp: 250 },
            { id: CP_3_ID, targetJp: 242 },
          ],
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("CURRICULUM_LOCKED");
    });
  });

  describe("POST /api/schools/:schoolId/departments/:deptId/curriculum/lock", () => {
    it("harus menolak penguncian jika ada elemen CP dengan kurang dari 2 Job Cards (422)", async () => {
      mockTenantPrisma.schoolDepartment.findFirst.mockResolvedValue({
        ...mockDept,
        jobCards: [
          { id: "00000000-0000-0000-0000-000000000031", cpElementId: CP_1_ID, title: "JC 1", isNonCompetency: false },
          // CP_1_ID cuma punya 1 job card
          { id: "00000000-0000-0000-0000-000000000033", cpElementId: CP_2_ID, title: "JC 3", isNonCompetency: false },
          { id: "00000000-0000-0000-0000-000000000034", cpElementId: CP_2_ID, title: "JC 4", isNonCompetency: false },
          { id: "00000000-0000-0000-0000-000000000035", cpElementId: CP_3_ID, title: "JC 5", isNonCompetency: false },
          { id: "00000000-0000-0000-0000-000000000036", cpElementId: CP_3_ID, title: "JC 6", isNonCompetency: false },
        ],
      });

      const res = await request(app)
        .post(`/api/schools/${TEST_SCHOOL_ID}/departments/${TEST_DEPT_ID}/curriculum/lock`)
        .set("Authorization", "Bearer mock-token");

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("MIN_JOB_CARDS_NOT_MET");
    });

    it("harus berhasil mengunci kurikulum jika semua syarat terpenuhi (200)", async () => {
      mockTenantPrisma.schoolDepartment.update.mockResolvedValue({ id: TEST_DEPT_ID, isLocked: true });

      const res = await request(app)
        .post(`/api/schools/${TEST_SCHOOL_ID}/departments/${TEST_DEPT_ID}/curriculum/lock`)
        .set("Authorization", "Bearer mock-token");

      expect(res.status).toBe(200);
      expect(res.body.data.isLocked).toBe(true);
    });
  });

  describe("POST /api/schools/:schoolId/departments/:deptId/curriculum/job-cards (Tambah Job Card)", () => {
    it("harus menolak jika judul melebihi 60 karakter (422)", async () => {
      const res = await request(app)
        .post(`/api/schools/${TEST_SCHOOL_ID}/departments/${TEST_DEPT_ID}/curriculum/job-cards`)
        .set("Authorization", "Bearer mock-token")
        .send({
          cpElementId: CP_1_ID,
          title: "Ini adalah judul job card yang sengaja dibuat sangat panjang sekali sehingga melebihi batas enam puluh karakter maksimum",
          toolsAndSoftware: ["VS Code"],
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("harus berhasil membuat Job Card baru dengan input valid (201)", async () => {
      mockTenantPrisma.jobCard.create.mockResolvedValue({
        id: "00000000-0000-0000-0000-000000000099",
        title: "Pembuatan Komponen UI Tailwind",
        cpElementId: CP_1_ID,
        isNonCompetency: false,
      });

      const res = await request(app)
        .post(`/api/schools/${TEST_SCHOOL_ID}/departments/${TEST_DEPT_ID}/curriculum/job-cards`)
        .set("Authorization", "Bearer mock-token")
        .send({
          cpElementId: CP_1_ID,
          title: "Pembuatan Komponen UI Tailwind",
          toolsAndSoftware: ["VS Code", "Tailwind CSS"],
          actionVerbTemplate: "Membuat",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe("00000000-0000-0000-0000-000000000099");
    });
  });

  describe("DELETE /api/schools/:schoolId/departments/:deptId/curriculum/job-cards/:jcId", () => {
    const TARGET_JC_ID = "00000000-0000-0000-0000-000000000031";

    it("harus menolak penghapusan jika Job Card sudah digunakan di logbook siswa (409)", async () => {
      mockTenantPrisma.dailyLogItem.count.mockResolvedValue(3);

      const res = await request(app)
        .delete(`/api/schools/${TEST_SCHOOL_ID}/departments/${TEST_DEPT_ID}/curriculum/job-cards/${TARGET_JC_ID}`)
        .set("Authorization", "Bearer mock-token");

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("JOB_CARD_IN_USE");
    });

    it("harus berhasil menghapus Job Card jika belum dipakai (200)", async () => {
      mockTenantPrisma.dailyLogItem.count.mockResolvedValue(0);
      mockTenantPrisma.jobCard.delete.mockResolvedValue({});

      const res = await request(app)
        .delete(`/api/schools/${TEST_SCHOOL_ID}/departments/${TEST_DEPT_ID}/curriculum/job-cards/${TARGET_JC_ID}`)
        .set("Authorization", "Bearer mock-token");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(TARGET_JC_ID);
    });
  });
});

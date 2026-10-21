import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

vi.mock("../src/lib/prisma.js", () => {
  const mockSchool = {
    id: "00000000-0000-0000-0000-000000000001",
    npsn: "12345678",
    name: "SMK Negeri 1 Surabaya",
    province: "Jawa Timur",
    city: "Surabaya",
    isDemoSandbox: false,
  };

  const mockPeriod = {
    id: "00000000-0000-0000-0000-000000000002",
    schoolId: mockSchool.id,
    name: "PKL Semester Genap 2025/2026",
    targetTotalJp: 792,
  };

  const mockUserProfile = {
    id: "00000000-0000-0000-0000-000000000003",
    schoolId: mockSchool.id,
    role: "SCHOOL_ADMIN",
    fullName: "Admin Pokja PKL",
    identityNumber: "12345678",
  };

  return {
    prisma: {
      school: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        upsert: vi.fn().mockResolvedValue(mockSchool),
      },
      academicPeriod: {
        create: vi.fn().mockResolvedValue(mockPeriod),
      },
      userProfile: {
        upsert: vi.fn().mockResolvedValue(mockUserProfile),
        findUnique: vi.fn().mockResolvedValue(mockUserProfile),
        count: vi.fn().mockResolvedValue(5),
      },
      masterDepartment: {
        findUnique: vi.fn().mockResolvedValue({ id: "md-1", sectorCode: "RPL" }),
      },
      schoolDepartment: {
        create: vi.fn().mockResolvedValue({ id: "sd-1", sectorCode: "RPL", name: "Rekayasa Perangkat Lunak" }),
      },
      cpElement: {
        create: vi.fn().mockResolvedValue({ id: "cp-1", code: "RPL-CP-01", targetJp: 216 }),
      },
      jobCard: {
        create: vi.fn().mockResolvedValue({ id: "jc-1", title: "Testing Job Card" }),
      },
      placement: {
        count: vi.fn().mockResolvedValue(5),
      },
      $transaction: vi.fn(async (cb) => {
        return cb(prisma);
      }),
    },
    createTenantPrisma: vi.fn(() => ({
      userProfile: {
        count: vi.fn().mockResolvedValue(5),
      },
      placement: {
        count: vi.fn().mockResolvedValue(5),
      },
    })),
  };
});

// Mock Supabase admin user provisioning
vi.mock("../src/lib/supabase.js", () => ({
  provisionSupabaseUser: vi.fn().mockResolvedValue({ id: "user-uuid-123" }),
}));

describe("Schools API (FR-001)", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/schools/master-departments", () => {
    it("returns list of 6 master departments from seed data", async () => {
      const res = await request(app).get("/api/schools/master-departments");
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(6);
      const sectorCodes = res.body.data.map((d: { sectorCode: string }) => d.sectorCode);
      expect(sectorCodes).toContain("RPL");
      expect(sectorCodes).toContain("AKL");
      expect(sectorCodes).toContain("DKV");
      expect(sectorCodes).toContain("KULINER");
      expect(sectorCodes).toContain("FARMASI");
      expect(sectorCodes).toContain("OTOMOTIF");
    });
  });

  describe("POST /api/schools/register", () => {
    const validPayload = {
      npsn: "20501234",
      name: "SMK Negeri 1 Contoh",
      province: "Jawa Timur",
      city: "Surabaya",
      adminEmail: "admin@smkn1contoh.sch.id",
      adminPassword: "Password123!",
      adminFullName: "Drs. H. Ahmad Fauzi",
      selectedDepartmentSectorCodes: ["RPL", "AKL"],
      academicPeriodName: "PKL Semester Genap 2025/2026",
      targetTotalJp: 792,
    };

    it("rejects registration when NPSN is not 8 digits", async () => {
      const res = await request(app)
        .post("/api/schools/register")
        .send({ ...validPayload, npsn: "12345" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.errors.npsn).toBeDefined();
    });

    it("rejects registration when selected departments is empty", async () => {
      const res = await request(app)
        .post("/api/schools/register")
        .send({ ...validPayload, selectedDepartmentSectorCodes: [] });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.errors.selectedDepartmentSectorCodes).toBeDefined();
    });

    it("returns 409 conflict when school with NPSN already exists", async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValueOnce({
        id: "existing-id",
        npsn: "20501234",
        name: "SMK Eksisting",
        province: "Jawa Timur",
        city: "Surabaya",
        latitude: null,
        longitude: null,
        isDemoSandbox: false,
        createdAt: new Date(),
      });

      const res = await request(app)
        .post("/api/schools/register")
        .send(validPayload);

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("NPSN_ALREADY_EXISTS");
      expect(res.body.detail).toContain("sudah terdaftar");
    });

    it("successfully registers school and clones selected curriculum", async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValueOnce(null);

      const res = await request(app)
        .post("/api/schools/register")
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.school.name).toBe("SMK Negeri 1 Surabaya");
      expect(res.body.data.academicPeriod.targetTotalJp).toBe(792);
      expect(res.body.data.admin.role).toBe("SCHOOL_ADMIN");
    });
  });

  describe("POST /api/schools/demo-sandbox", () => {
    it("returns demo sandbox school and accounts for judge demo", async () => {
      vi.mocked(prisma.school.findFirst).mockResolvedValueOnce({
        id: "demo-school-id",
        npsn: "99000001",
        name: "SMK Demo VokaLink",
        province: "Jawa Timur",
        city: "Surabaya",
        latitude: null,
        longitude: null,
        isDemoSandbox: true,
        createdAt: new Date(),
        academicPeriods: [
          {
            id: "demo-period-id",
            schoolId: "demo-school-id",
            name: "PKL Semester Genap 2025/2026",
            startDate: new Date(),
            endDate: new Date(),
            targetTotalJp: 792,
            isActive: true,
            createdAt: new Date(),
          },
        ],
        schoolDepartments: [
          {
            id: "dept-1",
            schoolId: "demo-school-id",
            masterDepartmentId: null,
            sectorCode: "RPL",
            name: "Rekayasa Perangkat Lunak",
            isLocked: false,
            createdAt: new Date(),
            _count: { cpElements: 4, jobCards: 14 },
          },
        ],
        userProfiles: [
          {
            id: "teacher-id",
            schoolId: "demo-school-id",
            schoolDepartmentId: null,
            role: "TEACHER",
            fullName: "Budi Santoso, S.Kom",
            identityNumber: "197501012000011001",
            whatsappNumber: "6281234567890",
            homeLatitude: null,
            homeLongitude: null,
            createdAt: new Date(),
          },
          {
            id: "student-id-1",
            schoolId: "demo-school-id",
            schoolDepartmentId: null,
            role: "STUDENT",
            fullName: "Andi Pratama",
            identityNumber: "0078901234",
            whatsappNumber: "6281298765001",
            homeLatitude: null,
            homeLongitude: null,
            createdAt: new Date(),
          },
        ],
      });

      const res = await request(app).post("/api/schools/demo-sandbox");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.school.name).toBe("SMK Demo VokaLink");
      expect(res.body.data.demoAccounts.teacher.fullName).toBe("Budi Santoso, S.Kom");
      expect(res.body.data.demoAccounts.students[0].fullName).toBe("Andi Pratama");
    });
  });
});

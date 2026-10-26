import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { SignJWT } from "jose";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

vi.mock("../src/lib/prisma.js", () => {
  return {
    prisma: {
      userProfile: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    createTenantPrisma: vi.fn(),
  };
});

describe("Auth & Session Verification Routes (FR-001 & Multi-Tenant Google OAuth)", () => {
  const app = createApp();
  const jwtSecret =
    process.env["SUPABASE_JWT_SECRET"] ||
    "UJsz4xEKudTZFxJYNb67h+Xx/cqnkkmCj4IZDlrXEh/eK8Y7+vFeZ530uoFbIyGWB3iHjJ+335qHv1ks5wc5dw==";

  beforeEach(() => {
    process.env["SUPABASE_JWT_SECRET"] = jwtSecret;
  });

  async function generateToken(sub: string, email: string) {
    const key = new TextEncoder().encode(jwtSecret);
    return new SignJWT({
      sub,
      email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(key);
  }

  it("returns 401 when no Authorization header is provided to /auth/me", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 ACCOUNT_NOT_LINKED_TO_SCHOOL when authenticated user has no school profile", async () => {
    const token = await generateToken("00000000-0000-0000-0000-000000000001", "unlinked.user@gmail.com");
    vi.mocked(prisma.userProfile.findUnique).mockResolvedValue(null);

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ACCOUNT_NOT_LINKED_TO_SCHOOL");
    expect(res.body.title).toBe("Akun Belum Terhubung dengan Sekolah");
    expect(res.body.detail).toBe(
      "Email Google Anda (unlinked.user@gmail.com) belum terdaftar di database sekolah manapun di VokaLink."
    );
  });

  it("returns 200 with user profile and school details when user is linked to a school", async () => {
    const token = await generateToken("00000000-0000-0000-0000-000000000002", "budi.guru@smk.id");
    const mockProfile = {
      id: "00000000-0000-0000-0000-000000000002",
      schoolId: "00000000-0000-0000-0000-000000000099",
      role: "TEACHER" as const,
      fullName: "Budi Santoso, S.Kom",
      identityNumber: "197501012000011001",
      whatsappNumber: "6281234567890",
      schoolDepartmentId: null,
      homeLatitude: null,
      homeLongitude: null,
      createdAt: new Date(),
      school: {
        id: "00000000-0000-0000-0000-000000000099",
        name: "SMK Negeri 1 Surabaya",
        npsn: "12345678",
        province: "Jawa Timur",
        city: "Surabaya",
        isDemoSandbox: false,
      },
      schoolDepartment: null,
    };

    vi.mocked(prisma.userProfile.findUnique).mockResolvedValue(mockProfile as any);

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("TEACHER");
    expect(res.body.data.fullName).toBe("Budi Santoso, S.Kom");
    expect(res.body.data.email).toBe("budi.guru@smk.id");
    expect(res.body.data.school.name).toBe("SMK Negeri 1 Surabaya");
    expect(res.body.data.school.npsn).toBe("12345678");
  });

  it("returns 401 on /login-identifier when identifier is not found", async () => {
    vi.mocked(prisma.userProfile.findFirst).mockResolvedValue(null);

    const res = await request(app)
      .post("/api/v1/auth/login-identifier")
      .send({ identifier: "9999999999", password: "randomPassword" });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
    expect(res.body.detail).toContain("tidak terdaftar di database sekolah manapun");
  });

  it("returns 401 on /login-identifier when password does not match", async () => {
    const mockStudent = {
      id: "student-uuid",
      schoolId: "school-uuid",
      role: "STUDENT" as const,
      fullName: "Andi Pratama",
      identityNumber: "0078901234",
      whatsappNumber: "628123456789",
      schoolDepartmentId: "dept-uuid",
      homeLatitude: null,
      homeLongitude: null,
      createdAt: new Date(),
      school: {
        id: "school-uuid",
        name: "SMK Demo",
        npsn: "99000001",
        province: "Jawa Timur",
        city: "Surabaya",
        isDemoSandbox: true,
      },
      schoolDepartment: null,
    };

    vi.mocked(prisma.userProfile.findFirst).mockResolvedValue(mockStudent as any);

    const res = await request(app)
      .post("/api/v1/auth/login-identifier")
      .send({ identifier: "0078901234", password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
    expect(res.body.detail).toContain("Kata sandi atau kode akses tidak sesuai");
  });

  it("returns 200 on /login-identifier when NISN and password match", async () => {
    const mockStudent = {
      id: "student-uuid",
      schoolId: "school-uuid",
      role: "STUDENT" as const,
      fullName: "Andi Pratama",
      identityNumber: "0078901234",
      whatsappNumber: "628123456789",
      schoolDepartmentId: "dept-uuid",
      homeLatitude: null,
      homeLongitude: null,
      createdAt: new Date(),
      school: {
        id: "school-uuid",
        name: "SMK Demo",
        npsn: "99000001",
        province: "Jawa Timur",
        city: "Surabaya",
        isDemoSandbox: true,
      },
      schoolDepartment: null,
    };

    vi.mocked(prisma.userProfile.findFirst).mockResolvedValue(mockStudent as any);

    const res = await request(app)
      .post("/api/v1/auth/login-identifier")
      .send({ identifier: "0078901234", password: "VokaLink2026!" });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("STUDENT");
    expect(res.body.data.fullName).toBe("Andi Pratama");
    expect(res.body.token).toBeDefined();
  });
});

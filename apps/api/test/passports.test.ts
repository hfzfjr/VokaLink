import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { sealObjectWithHmac } from "@vokalink/core/crypto";

const TEST_STUDENT_ID = "00000000-0000-0000-0000-000000000021";
const TEST_SCHOOL_ID = "00000000-0000-0000-0000-000000000002";
const TEST_DUDI_ID = "00000000-0000-0000-0000-000000000050";
const TEST_PASSPORT_SLUG = "andi-pratama-rpl-2026";
const TEST_SECRET =
  process.env.SERVER_CRYPTO_SECRET || "vokalink_dev_server_crypto_secret_32bytes_min!";

const mockStudentProfile = {
  id: TEST_STUDENT_ID,
  fullName: "Andi Pratama",
  identityNumber: "0071234567",
  whatsappNumber: "+62 812-9876-5001",
  role: "STUDENT",
  school: {
    id: TEST_SCHOOL_ID,
    name: "SMK Demo VokaLink",
    address: "Jl. Pendidikan Vokasi No. 1, Surabaya",
  },
  schoolDepartment: {
    id: "dept-rpl",
    name: "Rekayasa Perangkat Lunak",
    cpElements: [
      {
        id: "cp-1",
        code: "RPL-CP-01",
        title: "Pemrograman Web & Mobile",
        targetJp: 100,
        sortOrder: 1,
        jobCards: [],
      },
    ],
  },
  skillPassport: {
    id: "passport-1",
    studentId: TEST_STUDENT_ID,
    passportSlug: TEST_PASSPORT_SLUG,
    summaryBio: "Ringkasan vokasi kustom Andi Pratama di bidang REST API dan database.",
    extraActivitiesJson: [
      {
        title: "Mini-Project Microservices Audit Log",
        year: "2026",
        description: "Membangun sistem logging audit internal di PT Nusantara Tech.",
      },
    ],
    visibilityJson: { showPhotos: true, showGrades: true },
    totalVerifiedJp: 64,
    masterSignatureHash: "valid-master-hash-placeholder",
    revokedAt: null,
    updatedAt: new Date("2026-10-21T10:00:00Z"),
  },
  studentPlacements: [
    {
      id: "placement-1",
      dudiPartner: {
        id: TEST_DUDI_ID,
        name: "PT Nusantara Tech",
        city: "Surabaya",
      },
      dudiMentor: {
        id: "mentor-1",
        fullName: "Rizky Firmansyah",
      },
      endorsement: {
        id: "end-1",
        attitudeScore: 95,
        badgesArray: ["EXCELLENT_COMMUNICATION", "TECHNICAL_MASTERY"],
        endorsementQuote: "Andi menunjukkan kedewasaan teknis luar biasa.",
      },
      dailyLogs: [
        {
          id: "log-1",
          logDate: new Date("2026-03-01T08:00:00Z"),
          status: "VERIFIED",
          signatureHash: "sig-hash-1",
          evidenceWebpUrl: "/evidence/sample-1.webp",
          items: [
            {
              id: "item-1",
              jobCardId: "jc-1",
              durationJp: 40,
              autonomyLevel: 3,
              jobCard: {
                id: "jc-1",
                title: "REST API Endpoint",
                skkniUnitCode: "J.620100.009.01",
                toolsAndSoftware: ["Express", "TypeScript"],
                actionVerbTemplate: "Mengembangkan endpoint backend",
                isNonCompetency: false,
                cpElementId: "cp-1",
              },
            },
            {
              id: "item-2",
              jobCardId: "jc-2",
              durationJp: 16,
              autonomyLevel: 3,
              jobCard: {
                id: "jc-2",
                title: "PostgreSQL Migration",
                skkniUnitCode: "J.620100.010.01",
                toolsAndSoftware: ["PostgreSQL", "Prisma"],
                actionVerbTemplate: "Merancang skema relasional",
                isNonCompetency: false,
                cpElementId: "cp-1",
              },
            },
            // Item Non-Kompetensi Tombol Jujur (BR-004)
            {
              id: "item-3",
              jobCardId: "jc-noncomp",
              durationJp: 8,
              autonomyLevel: 1,
              jobCard: {
                id: "jc-noncomp",
                title: "Bantuan Operasional Umum (Non-Jurusan)",
                skkniUnitCode: null,
                toolsAndSoftware: [],
                actionVerbTemplate: null,
                isNonCompetency: true,
                cpElementId: null,
              },
            },
          ],
        },
      ],
    },
  ],
};

const { mockPrisma } = vi.hoisted(() => {
  const mock: any = {
    userProfile: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    skillPassport: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
  };
  return { mockPrisma: mock };
});

vi.mock("../src/lib/prisma.js", () => {
  return {
    prisma: mockPrisma,
  };
});

describe("Student ATS-CV & Skill Passport API Router (FR-012)", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env["SERVER_CRYPTO_SECRET"] = TEST_SECRET;
  });

  describe("GET /api/v1/students/me/cv", () => {
    it("berhasil menghasilkan payload CV ATS lengkap dari log VERIFIED (BR-010)", async () => {
      mockPrisma.userProfile.findFirst.mockResolvedValue(mockStudentProfile);

      const res = await request(app).get("/api/v1/students/me/cv");

      expect(res.status).toBe(200);
      expect(res.body.student.fullName).toBe("Andi Pratama");
      expect(res.body.student.departmentName).toBe("Rekayasa Perangkat Lunak");
      expect(res.body.summaryBio).toBe(mockStudentProfile.skillPassport.summaryBio);

      // Verifikasi jam kerja: Teknis (40+16 = 56 JP), Non-Kompetensi (8 JP), Total = 64 JP
      expect(res.body.technicalJp).toBe(56);
      expect(res.body.nonCompetencyJp).toBe(8);
      expect(res.body.totalVerifiedJp).toBe(64);

      // Verifikasi pengalaman kerja
      expect(res.body.experiences.length).toBe(1);
      const exp = res.body.experiences[0];
      expect(exp.dudiName).toBe("PT Nusantara Tech");
      expect(exp.totalVerifiedJp).toBe(64);

      // Bullet points hanya memuat kompetensi teknis (BR-004)
      expect(exp.bulletPoints.length).toBe(2);
      expect(exp.bulletPoints[0].jobCardTitle).toBe("REST API Endpoint");
      expect(exp.bulletPoints[0].bulletText).toContain("40 JP kerja terverifikasi");
      expect(exp.bulletPoints[1].jobCardTitle).toBe("PostgreSQL Migration");

      // Verifikasi daftar keterampilan teknis unik
      const skillNames = res.body.technicalSkills.map((s: any) => s.name);
      expect(skillNames).toContain("TypeScript");
      expect(skillNames).toContain("Express");
      expect(skillNames).toContain("PostgreSQL");

      // Verifikasi endorsement
      expect(res.body.endorsement.attitudeScore).toBe(95);
      expect(res.body.endorsement.mentorName).toBe("Rizky Firmansyah");
      expect(res.body.passportSlug).toBe(TEST_PASSPORT_SLUG);
    });

    it("mengembalikan 404 jika profil siswa tidak ditemukan", async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);

      const res = await request(app).get("/api/v1/students/me/cv?studentId=nonexistent-uuid");
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("STUDENT_NOT_FOUND");
    });
  });

  describe("PATCH /api/v1/students/me/passport", () => {
    it("berhasil memperbarui ringkasan bio dan ekstrakurikuler siswa", async () => {
      mockPrisma.userProfile.findFirst.mockResolvedValue(mockStudentProfile);
      mockPrisma.skillPassport.upsert.mockResolvedValue({
        id: "passport-1",
        studentId: TEST_STUDENT_ID,
        passportSlug: TEST_PASSPORT_SLUG,
        summaryBio: "Ringkasan baru yang telah disunting siswa.",
        extraActivitiesJson: [{ title: "Lomba Web UINIC 8.0", year: "2026" }],
      });

      const res = await request(app)
        .patch("/api/v1/students/me/passport")
        .send({
          summaryBio: "Ringkasan baru yang telah disunting siswa.",
          extraActivities: [{ title: "Lomba Web UINIC 8.0", year: "2026" }],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.passport.summaryBio).toBe("Ringkasan baru yang telah disunting siswa.");
    });
  });

  describe("GET /api/v1/passports/:slug", () => {
    it("mengembalikan data verifikasi publik resmi untuk slug yang valid (TC-010)", async () => {
      // Hitung hash valid
      const validMasterHash = sealObjectWithHmac(TEST_SECRET, {
        signatureHashes: ["sig-hash-1"],
        studentId: TEST_STUDENT_ID,
        totalVerifiedJp: 64,
      });

      const passportWithValidHash = {
        ...mockStudentProfile.skillPassport,
        masterSignatureHash: validMasterHash,
        student: mockStudentProfile,
      };

      mockPrisma.skillPassport.findUnique.mockResolvedValue(passportWithValidHash);

      const res = await request(app).get(`/api/v1/passports/${TEST_PASSPORT_SLUG}`);

      expect(res.status).toBe(200);
      expect(res.body.isCryptographicallyValid).toBe(true);
      expect(res.body.statusLabel).toBe("TERVERIFIKASI RESMI");
      expect(res.body.student.fullName).toBe("Andi Pratama");
      expect(res.body.metrics.totalVerifiedJp).toBe(64);
      expect(res.body.competencies.length).toBe(1);
      expect(res.body.competencies[0].percentage).toBe(56); // 56 JP dari target 100 JP
      expect(res.body.artifactPhotos).toContain("/evidence/sample-1.webp");
    });

    it("mengembalikan 404 jika slug paspor tidak ditemukan atau dicabut", async () => {
      mockPrisma.skillPassport.findUnique.mockResolvedValue(null);

      const res = await request(app).get("/api/v1/passports/slug-palsu-tidak-ada");
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("PASSPORT_NOT_FOUND");
    });
  });
});

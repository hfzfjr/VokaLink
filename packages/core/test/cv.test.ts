import { describe, it, expect } from "vitest";
import {
  generateXyzBulletPoint,
  generateCvFromLogs,
  getAutonomyAdverb,
  RawLogInput,
} from "../src/cv.js";

describe("ATS-CV Generator Engine (FR-012)", () => {
  describe("XYZ Formula Bullet Points", () => {
    it("generates structured bullet points with tools, autonomy, and SKKNI unit", () => {
      const text = generateXyzBulletPoint({
        actionVerbTemplate: "Mengembangkan dan menguji endpoint RESTful API",
        toolsAndSoftware: ["Express", "TypeScript", "PostgreSQL"],
        jobCardTitle: "Pengembangan REST API",
        skkniUnitCode: "J.620100.009.01",
        totalJp: 64,
        taskCount: 8,
        autonomyLevel: 3,
      });

      expect(text).toContain("Mengembangkan dan menguji endpoint RESTful API");
      expect(text).toContain("menggunakan Express, TypeScript, PostgreSQL");
      expect(text).toContain("secara mandiri");
      expect(text).toContain("melalui 8 penugasan");
      expect(text).toContain("akumulasi 64 JP kerja terverifikasi");
      expect(text).toContain("SKKNI: J.620100.009.01");
    });

    it("falls back gracefully when action verb template is not provided", () => {
      const text = generateXyzBulletPoint({
        actionVerbTemplate: null,
        toolsAndSoftware: ["Git"],
        jobCardTitle: "Version Control Workflow",
        skkniUnitCode: null,
        totalJp: 16,
        taskCount: 2,
        autonomyLevel: 2,
      });

      expect(text).toContain("Melaksanakan penugasan Version Control Workflow");
      expect(text).toContain("menggunakan Git");
      expect(text).toContain("secara terbimbing");
      expect(text).toContain("akumulasi 16 JP kerja terverifikasi");
      expect(text).not.toContain("SKKNI:");
    });

    it("correctly maps autonomy levels to standard Indonesian adverbs", () => {
      expect(getAutonomyAdverb(3)).toBe("secara mandiri");
      expect(getAutonomyAdverb(2)).toBe("secara terbimbing");
      expect(getAutonomyAdverb(1)).toBe("melalui observasi langsung");
    });
  });

  describe("CV Generation from Daily Logs (BR-010 & BR-004)", () => {
    const mockLogs: RawLogInput[] = [
      // 1. Log VERIFIED - Technical Job Card 1 (Express/TS)
      {
        id: "log-1",
        logDate: "2026-02-02T08:00:00Z",
        status: "VERIFIED",
        placementId: "placement-dudi-a",
        dudiName: "PT Nusantara Tech",
        dudiCity: "Surabaya",
        mentorName: "Rizky Firmansyah",
        items: [
          {
            jobCardId: "jc-api",
            jobCardTitle: "REST API Endpoint",
            skkniUnitCode: "J.620100.009.01",
            toolsAndSoftware: ["Express", "TypeScript"],
            actionVerbTemplate: "Mengembangkan endpoint backend",
            isNonCompetency: false,
            durationJp: 8,
            autonomyLevel: 3,
          },
        ],
      },
      // 2. Log VERIFIED - Technical Job Card 1 again (accumulating JP & tools)
      {
        id: "log-2",
        logDate: "2026-02-03T08:00:00Z",
        status: "VERIFIED",
        placementId: "placement-dudi-a",
        dudiName: "PT Nusantara Tech",
        dudiCity: "Surabaya",
        mentorName: "Rizky Firmansyah",
        items: [
          {
            jobCardId: "jc-api",
            jobCardTitle: "REST API Endpoint",
            skkniUnitCode: "J.620100.009.01",
            toolsAndSoftware: ["TypeScript", "PostgreSQL"],
            actionVerbTemplate: "Mengembangkan endpoint backend",
            isNonCompetency: false,
            durationJp: 6,
            autonomyLevel: 3,
          },
        ],
      },
      // 3. Log VERIFIED - Tombol Jujur Non-Kompetensi (BR-004)
      {
        id: "log-3",
        logDate: "2026-02-04T08:00:00Z",
        status: "VERIFIED",
        placementId: "placement-dudi-a",
        dudiName: "PT Nusantara Tech",
        dudiCity: "Surabaya",
        mentorName: "Rizky Firmansyah",
        items: [
          {
            jobCardId: "jc-noncomp",
            jobCardTitle: "Bantuan Operasional Umum (Non-Jurusan)",
            skkniUnitCode: null,
            toolsAndSoftware: [],
            actionVerbTemplate: null,
            isNonCompetency: true,
            durationJp: 6,
            autonomyLevel: 1,
          },
        ],
      },
      // 4. Log PENDING_VERIFICATION - Should be COMPLETELY IGNORED (BR-010)
      {
        id: "log-4",
        logDate: "2026-02-05T08:00:00Z",
        status: "PENDING_VERIFICATION",
        placementId: "placement-dudi-a",
        dudiName: "PT Nusantara Tech",
        dudiCity: "Surabaya",
        items: [
          {
            jobCardId: "jc-security",
            jobCardTitle: "Keamanan Sistem & JWT",
            skkniUnitCode: "J.620100.012.01",
            toolsAndSoftware: ["Jose", "JWT"],
            actionVerbTemplate: "Menerapkan autentikasi",
            isNonCompetency: false,
            durationJp: 8,
            autonomyLevel: 3,
          },
        ],
      },
      // 5. Log REVISION_REQUIRED - Should be COMPLETELY IGNORED (BR-010)
      {
        id: "log-5",
        logDate: "2026-02-06T08:00:00Z",
        status: "REVISION_REQUIRED",
        placementId: "placement-dudi-a",
        dudiName: "PT Nusantara Tech",
        dudiCity: "Surabaya",
        items: [
          {
            jobCardId: "jc-db",
            jobCardTitle: "Migrasi Skema Basis Data",
            toolsAndSoftware: ["Prisma"],
            isNonCompetency: false,
            durationJp: 8,
            autonomyLevel: 2,
          },
        ],
      },
    ];

    it("strictly isolates verified logs and excludes unverified claims (BR-010)", () => {
      const cv = generateCvFromLogs({ logs: mockLogs, studentDepartment: "RPL" });

      // Technical JP: 8 + 6 = 14 JP
      expect(cv.technicalJp).toBe(14);
      // Non-competency JP: 6 JP
      expect(cv.nonCompetencyJp).toBe(6);
      // Total verified: 14 + 6 = 20 JP (log-4 and log-5 not counted at all)
      expect(cv.totalVerifiedJp).toBe(20);

      // Unverified skills (Jose, JWT, Prisma) must NOT appear in skills list
      const skillNames = cv.technicalSkills.map((s) => s.name);
      expect(skillNames).toContain("TypeScript");
      expect(skillNames).toContain("Express");
      expect(skillNames).toContain("PostgreSQL");
      expect(skillNames).not.toContain("Jose");
      expect(skillNames).not.toContain("JWT");
      expect(skillNames).not.toContain("Prisma");
    });

    it("excludes non-competency tasks from technical bullet points while retaining total hours (BR-004)", () => {
      const cv = generateCvFromLogs({ logs: mockLogs, studentDepartment: "RPL" });

      expect(cv.experiences.length).toBe(1);
      const exp = cv.experiences[0]!;
      expect(exp.dudiName).toBe("PT Nusantara Tech");
      expect(exp.totalVerifiedJp).toBe(20);
      expect(exp.technicalJp).toBe(14);
      expect(exp.nonCompetencyJp).toBe(6);

      // Bullet points must ONLY contain technical Job Cards
      expect(exp.bulletPoints.length).toBe(1);
      expect(exp.bulletPoints[0]!.jobCardTitle).toBe("REST API Endpoint");
      expect(exp.bulletPoints[0]!.totalJp).toBe(14);
      expect(exp.bulletPoints[0]!.bulletText).toContain("14 JP kerja terverifikasi");
      // Must not contain non-competency title
      const allBulletsText = exp.bulletPoints.map((b) => b.bulletText).join(" ");
      expect(allBulletsText).not.toContain("Bantuan Operasional Umum");
    });

    it("supports multi-DUDI rotation scenarios seamlessly (TC-009)", () => {
      const multiLogs: RawLogInput[] = [
        ...mockLogs,
        // Second placement at PT Barokah Abadi (Rotation)
        {
          id: "log-rot-1",
          logDate: "2026-03-01T08:00:00Z",
          status: "VERIFIED",
          placementId: "placement-dudi-b",
          dudiName: "PT Barokah Abadi",
          dudiCity: "Sidoarjo",
          mentorName: "Ahmad Dahlan",
          items: [
            {
              jobCardId: "jc-frontend",
              jobCardTitle: "Slicing UI Responsif",
              skkniUnitCode: "J.620100.015.01",
              toolsAndSoftware: ["Next.js", "Tailwind CSS"],
              actionVerbTemplate: "Mengimplementasikan antarmuka web responsif",
              isNonCompetency: false,
              durationJp: 10,
              autonomyLevel: 3,
            },
          ],
        },
      ];

      const cv = generateCvFromLogs({ logs: multiLogs, studentDepartment: "RPL" });

      expect(cv.experiences.length).toBe(2);
      expect(cv.experiences[0]!.dudiName).toBe("PT Nusantara Tech");
      expect(cv.experiences[1]!.dudiName).toBe("PT Barokah Abadi");
      expect(cv.experiences[1]!.technicalJp).toBe(10);
      expect(cv.experiences[1]!.bulletPoints[0]!.jobCardTitle).toBe("Slicing UI Responsif");

      // Total verified reflects both companies: 20 + 10 = 30 JP
      expect(cv.totalVerifiedJp).toBe(30);
      expect(cv.skkniUnitsCount).toBe(2);
    });

    it("generates a professional vocational summary bio with accurate metrics", () => {
      const cv = generateCvFromLogs({
        logs: mockLogs,
        studentDepartment: "Rekayasa Perangkat Lunak",
      });

      expect(cv.defaultSummaryBio).toContain("Rekayasa Perangkat Lunak");
      expect(cv.defaultSummaryBio).toContain("20 JP terverifikasi resmi");
      expect(cv.defaultSummaryBio).toContain("PT Nusantara Tech");
      expect(cv.defaultSummaryBio).toContain("TypeScript");
    });
  });
});

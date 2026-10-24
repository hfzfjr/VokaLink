import { describe, it, expect } from "vitest";
import {
  normalizeIndonesianPhoneNumber,
  buildWhatsAppDeepLink,
  generateInterventionMessage,
} from "../src/intervention.js";

describe("Smart Intervention Dispatcher Pure Logic (FR-009)", () => {
  describe("normalizeIndonesianPhoneNumber", () => {
    it("menormalisasi awalan 08 menjadi 628", () => {
      expect(normalizeIndonesianPhoneNumber("081234567890")).toBe("6281234567890");
    });

    it("menghapus spasi, strip, dan karakter non-angka", () => {
      expect(normalizeIndonesianPhoneNumber("+62 812-3456-7890")).toBe("6281234567890");
      expect(normalizeIndonesianPhoneNumber("(0812) 3456 7890")).toBe("6281234567890");
    });

    it("menambahkan 62 jika diawali angka 8 langsung", () => {
      expect(normalizeIndonesianPhoneNumber("81234567890")).toBe("6281234567890");
    });

    it("mempertahankan nomor yang sudah diawali 62", () => {
      expect(normalizeIndonesianPhoneNumber("6281234567890")).toBe("6281234567890");
    });
  });

  describe("buildWhatsAppDeepLink", () => {
    it("menghasilkan URL wa.me dengan nomor ternormalisasi dan teks ter-encode", () => {
      const link = buildWhatsAppDeepLink("081234567890", "Halo Bapak Mentor!");
      expect(link).toContain("https://wa.me/6281234567890?text=");
      expect(link).toContain("Halo%20Bapak%20Mentor!");
    });
  });

  describe("generateInterventionMessage", () => {
    const baseParams = {
      studentName: "Bintang Ramadhan",
      studentNisn: "0078901235",
      departmentName: "Rekayasa Perangkat Lunak",
      schoolName: "SMK Negeri 1 Surabaya",
      teacherName: "Dra. Siti Rahayu, M.Pd",
      mentorName: "Budi Santoso",
      mentorTitle: "Senior Tech Lead",
      dudiName: "PT Inovasi Digital Mandiri",
    };

    it("menghasilkan draf pesan formal untuk anomali NON_COMPETENCY_OVERLOAD", () => {
      const text = generateInterventionMessage({
        ...baseParams,
        alertType: "NON_COMPETENCY_OVERLOAD",
        nonCompetencyJpLast14Days: 16,
        totalJpLast14Days: 40,
        zeroJpElements: ["Pengujian & QA", "Cloud & CI/CD"],
        recommendedJobCards: ["Manual Testing", "API Automation"],
      });

      expect(text).toContain("Yth. Bapak/Ibu Budi Santoso (Senior Tech Lead)");
      expect(text).toContain("PT Inovasi Digital Mandiri");
      expect(text).toContain("Bintang Ramadhan");
      expect(text).toContain("16 JP (40%)");
      expect(text).toContain("Pengujian & QA, Cloud & CI/CD");
      expect(text).toContain("Manual Testing, API Automation");
      expect(text).toContain("Dra. Siti Rahayu, M.Pd");
    });

    it("menghasilkan draf pesan formal untuk anomali SKILL_MONOTONY", () => {
      const text = generateInterventionMessage({
        ...baseParams,
        studentName: "Citra Maharani",
        mentorName: "Siti Rahmawati",
        dudiName: "PT Artha Solusindo",
        alertType: "SKILL_MONOTONY",
        dominantElementName: "Pemrograman Web & Mobile",
        dominantJp: 162,
        dominantRatio: 0.85,
        zeroJpElements: ["Basis Data Relasional", "Cloud Pipeline"],
      });

      expect(text).toContain("Yth. Bapak/Ibu Siti Rahmawati");
      expect(text).toContain("Citra Maharani");
      expect(text).toContain("Pemrograman Web & Mobile");
      expect(text).toContain("162 JP (85%)");
      expect(text).toContain("Basis Data Relasional, Cloud Pipeline");
    });

    it("menghasilkan draf pesan formal untuk anomali APPROVAL_DORMANCY lengkap dengan magic link", () => {
      const text = generateInterventionMessage({
        ...baseParams,
        studentName: "Dewi Anggraini",
        mentorName: "Wahyu Pratama",
        dudiName: "Studio Kreatif Wirajaya",
        alertType: "APPROVAL_DORMANCY",
        dormantLogCount: 7,
        magicLinkUrl: "https://vokalink.id/v/magic-dewi-123",
      });

      expect(text).toContain("Yth. Bapak/Ibu Wahyu Pratama");
      expect(text).toContain("Dewi Anggraini");
      expect(text).toContain("7 entri jurnal harian");
      expect(text).toContain("https://vokalink.id/v/magic-dewi-123");
      expect(text).toContain("< 10 detik");
    });

    it("menghasilkan draf pesan advokasi K3 untuk anomali STUDENT_OVERWORK_HOURS", () => {
      const text = generateInterventionMessage({
        ...baseParams,
        studentName: "Rian Hidayat",
        alertType: "STUDENT_OVERWORK_HOURS",
        totalJpLast14Days: 96, // 48 jam/minggu
      });

      expect(text).toContain("Rian Hidayat");
      expect(text).toContain("48 jam kerja riil");
      expect(text).toContain("Permendikbudristek No. 50 Tahun 2020");
      expect(text).toContain("batas waktu wajar");
    });
  });
});


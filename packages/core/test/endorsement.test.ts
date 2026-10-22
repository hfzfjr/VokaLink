import { describe, it, expect } from "vitest";
import {
  calculateDudiQualityIndex,
  composeEndorsementQuote,
} from "../src/endorsement.js";

describe("FR-010: Pure Domain Logic (Endorsement & DUDI Quality Index)", () => {
  describe("1. calculateDudiQualityIndex (DESIGN.md §8.6)", () => {
    it("menghasilkan skor 100 dan kategori Mitra Unggulan untuk performa sempurna", () => {
      const res = calculateDudiQualityIndex({
        totalJp: 400,
        competencyJp: 400, // 100% relevan -> 50 poin
        avgValidationDays: 0, // Kecepatan maks -> 30 poin
        supportedCpCount: 5,
        achievedCpCount: 5, // 100% CP -> 20 poin
      });

      expect(res.relevanceRatio).toBe(100);
      expect(res.speedScore).toBe(100);
      expect(res.coverageScore).toBe(100);
      expect(res.overallQualityScore).toBe(100);
      expect(res.category).toBe("Mitra Unggulan");
      expect(res.recommendation).toBe("Direkomendasikan Perpanjangan MoU");
    });

    it("mengklasifikasikan DUDI performa tinggi (skor >= 80) sebagai Mitra Unggulan", () => {
      // 90% relevansi = 45 poin
      // avg 1.4 hari validasi: 1 - (1.4 / 7) = 0.8 * 100 = 80 -> 24 poin
      // 4 dari 5 CP = 80% -> 16 poin
      // Total = 45 + 24 + 16 = 85
      const res = calculateDudiQualityIndex({
        totalJp: 500,
        competencyJp: 450,
        avgValidationDays: 1.4,
        supportedCpCount: 5,
        achievedCpCount: 4,
      });

      expect(res.overallQualityScore).toBe(85);
      expect(res.category).toBe("Mitra Unggulan");
      expect(res.recommendation).toBe("Direkomendasikan Perpanjangan MoU");
    });

    it("mengklasifikasikan DUDI skor 50-79 sebagai Mitra Perlu Evaluasi Penugasan", () => {
      // 60% relevansi = 30 poin
      // avg 3.5 hari validasi: 1 - 0.5 = 0.5 * 100 = 50 -> 15 poin
      // 3 dari 5 CP = 60% -> 12 poin
      // Total = 30 + 15 + 12 = 57
      const res = calculateDudiQualityIndex({
        totalJp: 400,
        competencyJp: 240,
        avgValidationDays: 3.5,
        supportedCpCount: 5,
        achievedCpCount: 3,
      });

      expect(res.overallQualityScore).toBe(57);
      expect(res.category).toBe("Mitra Perlu Evaluasi Penugasan");
      expect(res.recommendation).toBe("Perlu Evaluasi Penugasan & Rotasi Job Card");
    });

    it("mengklasifikasikan DUDI skor < 50 sebagai Mitra Zona Merah", () => {
      // 20% relevansi = 10 poin
      // avg 7 hari atau lebih: 1 - 1 = 0 -> 0 poin
      // 1 dari 5 CP = 20% -> 4 poin
      // Total = 10 + 0 + 4 = 14
      const res = calculateDudiQualityIndex({
        totalJp: 300,
        competencyJp: 60,
        avgValidationDays: 8.5, // melebihi 7 hari
        supportedCpCount: 5,
        achievedCpCount: 1,
      });

      expect(res.overallQualityScore).toBe(14);
      expect(res.category).toBe("Mitra Zona Merah");
      expect(res.recommendation).toBe("Tidak Direkomendasikan / Dominan Tugas Non-Kejuruan");
    });

    it("menangani data kosong / zero JP tanpa menghasilkan nilai NaN", () => {
      const res = calculateDudiQualityIndex({
        totalJp: 0,
        competencyJp: 0,
        avgValidationDays: 0,
        supportedCpCount: 0,
        achievedCpCount: 0,
      });

      expect(res.overallQualityScore).toBe(30); // Kecepatan default 100 -> 30 poin
      expect(Number.isNaN(res.overallQualityScore)).toBe(false);
      expect(res.category).toBe("Mitra Zona Merah");
    });
  });

  describe("2. composeEndorsementQuote (Alur A1)", () => {
    it("merangkai kutipan formal yang menyertakan nama siswa dan seluruh lencana terpilih", () => {
      const quote = composeEndorsementQuote(
        "Bintang Ramadhan",
        ["Ketelitian & Akurasi Kerja Tinggi", "Inisiatif Mandiri & Pemecahan Masalah"],
        95
      );

      expect(quote).toContain("Bintang Ramadhan");
      expect(quote).toContain("sangat memuaskan");
      expect(quote).toContain("Ketelitian & Akurasi Kerja Tinggi, Inisiatif Mandiri & Pemecahan Masalah");
      expect(quote).toContain("siap berkontribusi profesional");
    });

    it("menghasilkan predikat memuaskan untuk skor 80-89", () => {
      const quote = composeEndorsementQuote(
        "Aisyah Putri",
        ["Disiplin Waktu & Kepatuhan SOP/K3"],
        85
      );

      expect(quote).toContain("Aisyah Putri");
      expect(quote).toContain("memuaskan");
      expect(quote).toContain("Disiplin Waktu & Kepatuhan SOP/K3");
    });

    it("memberikan kutipan fallback jika tidak ada lencana yang disediakan", () => {
      const quote = composeEndorsementQuote("Rahmat Hidayat", []);

      expect(quote).toContain("Rahmat Hidayat");
      expect(quote).toContain("integritas kerja dan performa yang sangat baik");
    });
  });
});

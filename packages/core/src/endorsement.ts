import {
  DUDI_QUALITY_WEIGHT_RELEVANCE,
  DUDI_QUALITY_WEIGHT_SPEED,
  DUDI_QUALITY_WEIGHT_COVERAGE,
  DUDI_QUALITY_EXCELLENT_THRESHOLD,
  DUDI_QUALITY_EVALUATION_THRESHOLD,
  type DudiQualityCategory,
  type DudiQualityRecommendation,
} from "@vokalink/shared";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FR-010: Pure Domain Logic for Soft Skills Endorsement & DUDI Quality Index
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface CalculateDudiQualityInput {
  totalJp: number;
  competencyJp: number;
  avgValidationDays: number;
  supportedCpCount: number;
  achievedCpCount: number;
}

export interface DudiQualityScoreResult {
  relevanceRatio: number; // 0..100
  speedScore: number;     // 0..100
  coverageScore: number;  // 0..100
  overallQualityScore: number; // 0..100
  category: DudiQualityCategory;
  recommendation: DudiQualityRecommendation;
}

/**
 * Menghitung DUDI Partnership Quality Index sesuai rumus DESIGN.md §8.6 & PRD FR-010:
 * DUDI Score = (0.50 × RasioJamRelevan) + (0.30 × KecepatanValidasi) + (0.20 × CakupanRealisasiCP)
 * Skala 0 sampai 100.
 */
export function calculateDudiQualityIndex(
  input: CalculateDudiQualityInput
): DudiQualityScoreResult {
  const {
    totalJp,
    competencyJp,
    avgValidationDays,
    supportedCpCount,
    achievedCpCount,
  } = input;

  // 1. Rasio Jam Relevan (50%): JP Kompetensi / Total JP Semua Siswa di DUDI itu
  let relevanceRatio = 0;
  if (totalJp > 0) {
    relevanceRatio = Math.min(100, Math.max(0, (competencyJp / totalJp) * 100));
  }

  // 2. Kecepatan Validasi (30%): (1 - min(1, rata-rata hari / 7)) * 100
  let speedScore = 100;
  if (avgValidationDays > 0) {
    const penaltyRatio = Math.min(1, Math.max(0, avgValidationDays / 7));
    speedScore = (1 - penaltyRatio) * 100;
  }

  // 3. Cakupan Realisasi CP (20%): (elemen CP didukung yang mencapai >= 75% / total elemen CP didukung) * 100
  let coverageScore = 0;
  if (supportedCpCount > 0) {
    coverageScore = Math.min(100, Math.max(0, (achievedCpCount / supportedCpCount) * 100));
  }

  // Overall Score
  const rawScore =
    DUDI_QUALITY_WEIGHT_RELEVANCE * relevanceRatio +
    DUDI_QUALITY_WEIGHT_SPEED * speedScore +
    DUDI_QUALITY_WEIGHT_COVERAGE * coverageScore;

  const overallQualityScore = Number(Math.min(100, Math.max(0, rawScore)).toFixed(1));

  // Kategori & Rekomendasi MoU
  let category: DudiQualityCategory;
  let recommendation: DudiQualityRecommendation;

  if (overallQualityScore >= DUDI_QUALITY_EXCELLENT_THRESHOLD) {
    category = "Mitra Unggulan";
    recommendation = "Direkomendasikan Perpanjangan MoU";
  } else if (overallQualityScore >= DUDI_QUALITY_EVALUATION_THRESHOLD) {
    category = "Mitra Perlu Evaluasi Penugasan";
    recommendation = "Perlu Evaluasi Penugasan & Rotasi Job Card";
  } else {
    category = "Mitra Zona Merah";
    recommendation = "Tidak Direkomendasikan / Dominan Tugas Non-Kejuruan";
  }

  return {
    relevanceRatio: Number(relevanceRatio.toFixed(1)),
    speedScore: Number(speedScore.toFixed(1)),
    coverageScore: Number(coverageScore.toFixed(1)),
    overallQualityScore,
    category,
    recommendation,
  };
}

/**
 * Alur Alternatif A1: Merangkai kutipan testimoni rekomendasi formal otomatis
 * apabila pembimbing industri hanya memilih lencana tanpa mengetik kutipan manual.
 */
export function composeEndorsementQuote(
  studentName: string,
  selectedBadges: string[],
  attitudeScore?: number
): string {
  const cleanName = studentName.trim() || "Siswa";
  if (!selectedBadges || selectedBadges.length === 0) {
    return `Ananda ${cleanName} menunjukkan integritas kerja dan performa yang sangat baik selama menjalani masa magang PKL di industri kami.`;
  }

  const badgeText = selectedBadges.join(", ");
  const predicate =
    attitudeScore && attitudeScore >= 90
      ? "sangat memuaskan"
      : attitudeScore && attitudeScore >= 80
      ? "memuaskan"
      : "baik";

  return `Ananda ${cleanName} menunjukkan etos kerja ${predicate} dengan keunggulan utama dalam ${badgeText}. Sangat berpotensi dan siap berkontribusi profesional di dunia kerja industri.`;
}

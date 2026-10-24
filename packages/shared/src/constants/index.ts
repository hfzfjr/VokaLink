/**
 * VokaLink Core Business Constants
 * Standardized across Web, API, and Core packages.
 */

// BR-001: Target JP PKL SMK Fase F (Permendikbudristek No. 12 Tahun 2024)
export const TOTAL_TARGET_JP = 792;
export const MIN_PERIOD_TARGET_JP = 300;
export const MAX_PERIOD_TARGET_JP = 1200;

// BR-002: Batas JP Jurnal Harian
export const MIN_DAILY_JP = 1;
export const MAX_DAILY_JP = 12;

// BR-003: Batas Waktu Mundur (Backdate)
export const MAX_BACKDATE_DAYS = 3;

// BR-004: Kartu Pekerjaan Non-Kompetensi
export const NON_COMPETENCY_JOB_CARD_TITLE = "Bantuan Operasional Umum (Non-Jurusan)";

// BR-005 & BR-006: Smart Placement
export const PLACEMENT_WEIGHT_COMPETENCY = 0.70;
export const PLACEMENT_WEIGHT_DISTANCE = 0.30;
export const PLACEMENT_DISTANCE_MAX_FREE_KM = 5.0;
export const PLACEMENT_DISTANCE_PENALTY_RANGE_KM = 20.0;
export const ROTATION_THRESHOLD_COMPETENCY_SCORE = 50.0; // Persentase CP < 50% memicu rotasi tengah semester

// BR-007: Zero-Login Mentor Verification & PIN Security
export const PIN_LENGTH = 4;
export const PIN_MAX_FAILED_ATTEMPTS = 5;
export const PIN_LOCKOUT_MINUTES = 15;
export const QR_LINK_TTL_MINUTES = 5;
export const WA_LINK_TTL_DAYS = 7;
export const ACTIVATION_LINK_TTL_HOURS = 72;
export const ENDORSEMENT_LINK_TTL_DAYS = 14;

// BR-008: Deteksi Competency Drift
export const DRIFT_NON_COMPETENCY_THRESHOLD = 0.30; // > 30%
export const DRIFT_NON_COMPETENCY_MIN_JP = 20;      // min total 20 JP dalam 14 hari
export const DRIFT_MONOTONY_MIN_JP = 90;           // kumulatif >= 90 JP
export const DRIFT_MONOTONY_THRESHOLD = 0.80;       // > 80% pada 1 elemen tunggal
export const DRIFT_DORMANCY_MIN_LOGS = 5;          // >= 5 log pending
export const DRIFT_DORMANCY_DAYS = 7;              // berumur > 7 hari

// BR-009: e-Rapor Nilai Bobot Kemandirian
export const ERAPOR_AUTONOMY_WEIGHTS: Record<number, number> = {
  1: 75,  // Observasi
  2: 88,  // Terbimbing
  3: 100, // Mandiri (SOP)
};
export const ERAPOR_WEIGHT_TECHNICAL = 0.80;
export const ERAPOR_WEIGHT_ATTITUDE = 0.20;

// Standar 4 Elemen Resmi Mapel PKL Kurikulum Merdeka (Permendikbudristek No. 12/2024 & Panduan BSKAP)
export const OFFICIAL_PKL_ELEMENT_CODES = {
  SOFT_SKILLS: "PKL-EL-01",
  HARD_SKILLS_CORE: "PKL-EL-02",
  HARD_SKILLS_ADVANCED: "PKL-EL-03",
  ENTREPRENEURSHIP: "PKL-EL-04",
} as const;

export const OFFICIAL_PKL_ELEMENT_TITLES = {
  SOFT_SKILLS: "Internalisasi & Penerapan Soft Skills",
  HARD_SKILLS_CORE: "Penerapan Hard Skills",
  HARD_SKILLS_ADVANCED: "Peningkatan & Pengembangan Hard Skills",
  ENTREPRENEURSHIP: "Penyiapan Kemandirian Berwirausaha",
} as const;

export const OFFICIAL_PKL_ELEMENT_WEIGHTS = {
  SOFT_SKILLS: 0.20,          // 20% Internalisasi & Penerapan Soft Skills
  HARD_SKILLS_CORE: 0.40,     // 40% Penerapan Hard Skills
  HARD_SKILLS_ADVANCED: 0.25, // 25% Peningkatan & Pengembangan Hard Skills
  ENTREPRENEURSHIP: 0.15,     // 15% Penyiapan Kemandirian Berwirausaha
} as const;

export const SOP_RUBRIC_STANDARDS = {
  OBSERVASI: { min: 70, max: 75, baseScore: 75, label: "Cukup", description: "Baru Mengamati / Terbantu" },
  TERBIMBING: { min: 76, max: 85, baseScore: 85, label: "Baik", description: "Bekerja dengan Arahan Mentor" },
  MANDIRI_SOP: { min: 86, max: 98, baseScore: 95, label: "Sangat Baik", description: "Mandiri Sesuai Standar SOP DUDI" },
} as const;

// BR-010 & FR-010: Endorsement Batasan Lencana & Standar Lencana Etos Kerja
export const MAX_ENDORSEMENT_BADGES = 3;

export const WORK_ETHIC_BADGES = [
  "Ketelitian & Akurasi Kerja Tinggi",
  "Cepat Menguasai Prosedur & Alat Baru",
  "Inisiatif Mandiri & Pemecahan Masalah",
  "Disiplin Waktu & Kepatuhan SOP/K3",
  "Komunikasi Efektif & Kerjasama Tim",
] as const;

export type WorkEthicBadge = (typeof WORK_ETHIC_BADGES)[number];

// FR-010 & DESIGN.md §8.6: DUDI Quality Index Weights & Thresholds
export const DUDI_QUALITY_WEIGHT_RELEVANCE = 0.50; // 50% Rasio Jam Relevan
export const DUDI_QUALITY_WEIGHT_SPEED = 0.30;     // 30% Kecepatan Validasi
export const DUDI_QUALITY_WEIGHT_COVERAGE = 0.20;  // 20% Cakupan Realisasi CP
export const DUDI_QUALITY_EXCELLENT_THRESHOLD = 80; // >= 80: Mitra Unggulan
export const DUDI_QUALITY_EVALUATION_THRESHOLD = 50; // 50-79: Perlu Evaluasi, < 50: Zona Merah

// BR-012: Kuota Ukuran Bukti Foto
export const MAX_EVIDENCE_SIZE_BYTES = 153600; // 150 KB
export const TARGET_EVIDENCE_SIZE_MIN = 35840;  // 35 KB
export const TARGET_EVIDENCE_SIZE_MAX = 61440;  // 60 KB

// BR-013: Standar Perlindungan Siswa & K3 Jam Kerja PKL (Permendikbudristek No. 50/2020 & UU Ketenagakerjaan No. 13/2003)
export const STUDENT_MAX_NORMAL_WEEKLY_HOURS = 40;     // Batas jam kerja normal mingguan
export const STUDENT_OVERWORK_WARNING_HOURS = 42;      // Batas peringatan awal (Warning)
export const STUDENT_OVERWORK_CRITICAL_HOURS = 45;     // Batas kritis risiko eksploitasi (Critical)
export const STUDENT_OVERTIME_DAILY_THRESHOLD = 9;     // Jam kerja >= 9 jam/hari dikategorikan lembur/proyek
export const STUDENT_MAX_WEEKLY_OVERTIME_DAYS = 3;     // Maksimal 3 hari lembur dalam seminggu

// Konversi Jam Riil DUDI (60 menit) ke Jam Pelajaran Kurikulum (45 menit)
export const REAL_HOURS_TO_JP_RATIO = 60 / 45; // 1.333333...

export function convertRealHoursToJp(realHours: number): number {
  return Math.round(((realHours * 60) / 45) * 10) / 10;
}

// Preset Tombol Cepat (Quick-Tap Chips) Durasi Logbook
export interface QuickShiftPreset {
  id: string;
  label: string;
  sub: string;
  defaultHours: number;
  availableHours: number[];
  isRange: boolean;
}

export const QUICK_SHIFT_PRESETS: QuickShiftPreset[] = [
  {
    id: "HALF_DAY",
    label: "4 – 5 Jam",
    sub: "1/2 Hari / Shift Sabtu",
    defaultHours: 4,
    availableHours: [4, 5],
    isRange: true,
  },
  {
    id: "SHORT_SHIFT",
    label: "6 Jam",
    sub: "Shift Pagi / Sore",
    defaultHours: 6,
    availableHours: [6],
    isRange: false,
  },
  {
    id: "FULL_DAY_6D",
    label: "7 Jam",
    sub: "Full Day (6 Hari Kerja)",
    defaultHours: 7,
    availableHours: [7],
    isRange: false,
  },
  {
    id: "FULL_DAY_5D",
    label: "8 Jam",
    sub: "Full Day (5 Hari Kerja)",
    defaultHours: 8,
    availableHours: [8],
    isRange: false,
  },
  {
    id: "OVERTIME",
    label: "9 – 10 Jam",
    sub: "Jam Tambahan / Proyek",
    defaultHours: 9,
    availableHours: [9, 10],
    isRange: true,
  },
];


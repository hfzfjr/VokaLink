import {
  ERAPOR_AUTONOMY_WEIGHTS,
  ERAPOR_WEIGHT_TECHNICAL,
  ERAPOR_WEIGHT_ATTITUDE,
} from "@vokalink/shared";

export interface ElementLogItem {
  durationJp: number;
  autonomyLevel: 1 | 2 | 3;
}

export interface ElementGradeInput {
  targetJp: number;
  verifiedItems: ElementLogItem[];
}

export interface ElementGradeResult {
  verifiedJp: number;
  targetJp: number;
  autonomyScore: number;
  score: number;
}

/**
 * Calculates grade for a single CP element according to BR-009
 */
export function calculateElementGrade(
  input: ElementGradeInput
): ElementGradeResult {
  const verifiedJp = input.verifiedItems.reduce(
    (sum, item) => sum + item.durationJp,
    0
  );

  let autonomyScore = 0;
  if (verifiedJp > 0) {
    const totalWeightedAutonomy = input.verifiedItems.reduce((sum, item) => {
      const weight = ERAPOR_AUTONOMY_WEIGHTS[item.autonomyLevel] ?? 75;
      return sum + weight * item.durationJp;
    }, 0);
    autonomyScore = totalWeightedAutonomy / verifiedJp;
  }

  const jpRatio = input.targetJp > 0 ? (verifiedJp / input.targetJp) * 100 : 0;
  const rawScore = 0.60 * jpRatio + 0.40 * autonomyScore;
  const score = Math.min(100, Math.round(rawScore * 100) / 100);

  return {
    verifiedJp,
    targetJp: input.targetJp,
    autonomyScore: Math.round(autonomyScore * 100) / 100,
    score,
  };
}

export interface FinalGradeInput {
  elementScores: number[];
  mentorAttitudeScore?: number; // Optional (1-100)
}

/**
 * Calculates final e-Rapor grade according to BR-009
 */
export function calculateFinalPklGrade(input: FinalGradeInput): number {
  if (input.elementScores.length === 0) {
    return 0;
  }

  const avgTechnical =
    input.elementScores.reduce((sum, s) => sum + s, 0) /
    input.elementScores.length;

  if (typeof input.mentorAttitudeScore === "number") {
    const finalScore =
      avgTechnical * ERAPOR_WEIGHT_TECHNICAL +
      input.mentorAttitudeScore * ERAPOR_WEIGHT_ATTITUDE;
    return Math.round(finalScore * 100) / 100;
  }

  // 100% technical if attitude score is not available (e.g. cut-line)
  return Math.round(avgTechnical * 100) / 100;
}

export interface EraporStudentNarrativeInput {
  studentName: string;
  dudiName: string;
  topJobCardTitle?: string;
  topElementTitle?: string;
  lowestElementTitle?: string;
  lowestElementScore?: number;
}

export interface EraporNarrativeResult {
  highestAchievement: string;
  needsImprovement: string;
}

/**
 * Generator kalimat deskripsi capaian kurikulum merdeka e-Rapor SMK (FR-011)
 */
export function generateEraporNarratives(
  input: EraporStudentNarrativeInput
): EraporNarrativeResult {
  const topJob = input.topJobCardTitle || "pekerjaan teknis kejuruan";
  const topElement = input.topElementTitle || "elemen kompetensi utama";
  const dudi = input.dudiName || "mitra DUDI";

  const highestAchievement = `Menunjukkan penguasaan sangat baik dalam ${topJob} secara mandiri di ${dudi}, serta kompeten dalam ${topElement}.`;

  let needsImprovement = "";
  if (
    input.lowestElementTitle &&
    (input.lowestElementScore === undefined || input.lowestElementScore < 80)
  ) {
    needsImprovement = `Perlu peningkatan jam praktik dan bimbingan lebih lanjut dalam penguasaan elemen ${input.lowestElementTitle}.`;
  } else {
    needsImprovement = `Mampu mempertahankan konsistensi capaian pembelajaran praktik kerja lapangan dengan baik di seluruh elemen kompetensi.`;
  }

  return { highestAchievement, needsImprovement };
}

export interface EraporExportRow {
  nisn: string;
  studentName: string;
  dudiName: string;
  totalVerifiedJp: number;
  finalGrade: number;
  highestAchievement: string;
  needsImprovement: string;
}

/**
 * Menghasilkan file teks format CSV resmi siap impor ke aplikasi e-Rapor SMK
 */
export function generateEraporCsv(rows: EraporExportRow[]): string {
  const headers = [
    "NISN",
    "Nama_Siswa",
    "Nama_Mitra_DUDI",
    "Total_JP_Terverifikasi",
    "Nilai_Akhir_PKL",
    "Deskripsi_Capaian_Tertinggi",
    "Deskripsi_Capaian_Perlu_Bimbingan",
  ];

  const escapeCsv = (val: string | number) => {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const csvRows = [
    headers.join(","),
    ...rows.map((r) =>
      [
        escapeCsv(r.nisn),
        escapeCsv(r.studentName),
        escapeCsv(r.dudiName),
        escapeCsv(r.totalVerifiedJp),
        escapeCsv(r.finalGrade),
        escapeCsv(r.highestAchievement),
        escapeCsv(r.needsImprovement),
      ].join(",")
    ),
  ];

  return csvRows.join("\r\n");
}

import {
  ERAPOR_AUTONOMY_WEIGHTS,
  ERAPOR_WEIGHT_TECHNICAL,
  ERAPOR_WEIGHT_ATTITUDE,
  OFFICIAL_PKL_ELEMENT_CODES,
  OFFICIAL_PKL_ELEMENT_TITLES,
  OFFICIAL_PKL_ELEMENT_WEIGHTS,
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
  sopRubricScore?: number;
  masteryPredicate?: "Sangat Baik" | "Baik" | "Cukup" | "Perlu Bimbingan";
}

/**
 * Menghitung skor rubrik SOP industri berdasarkan tingkat kemandirian tertinggi & konsistensi validasi (BSKAP Mapel PKL)
 */
export function calculateSopRubricScore(items: ElementLogItem[]): {
  score: number;
  predicate: "Sangat Baik" | "Baik" | "Cukup" | "Perlu Bimbingan";
  maxAutonomyLevel: 1 | 2 | 3;
  verifiedCount: number;
} {
  if (items.length === 0) {
    return {
      score: 0,
      predicate: "Perlu Bimbingan",
      maxAutonomyLevel: 1,
      verifiedCount: 0,
    };
  }

  const maxAutonomyLevel = Math.max(...items.map((i) => i.autonomyLevel)) as 1 | 2 | 3;
  const level3Count = items.filter((i) => i.autonomyLevel === 3).length;
  const level2Count = items.filter((i) => i.autonomyLevel === 2).length;

  let score = 75;
  let predicate: "Sangat Baik" | "Baik" | "Cukup" | "Perlu Bimbingan" = "Cukup";

  if (maxAutonomyLevel === 3) {
    // Mandiri Sesuai SOP: jika konsisten (>= 3 validasi), skor 92-98
    score = level3Count >= 3 ? Math.min(98, 90 + Math.min(8, level3Count * 2)) : 88;
    predicate = "Sangat Baik";
  } else if (maxAutonomyLevel === 2) {
    // Terbimbing dengan arahan mentor: skor 78-85
    score = level2Count >= 3 ? 84 : 78;
    predicate = "Baik";
  } else {
    // Observasi / Membantu dasar: skor 70-75
    score = 75;
    predicate = "Cukup";
  }

  return {
    score,
    predicate,
    maxAutonomyLevel,
    verifiedCount: items.length,
  };
}

/**
 * Calculates grade for a single CP element according to BR-009 & SOP Rubric
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

  const rubric = calculateSopRubricScore(input.verifiedItems);

  return {
    verifiedJp,
    targetJp: input.targetJp,
    autonomyScore: Math.round(autonomyScore * 100) / 100,
    score,
    sopRubricScore: rubric.score,
    masteryPredicate:
      score >= 86
        ? "Sangat Baik"
        : score >= 76
        ? "Baik"
        : score >= 70
        ? "Cukup"
        : "Perlu Bimbingan",
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

// ─── RESMI 4 ELEMEN MAPEL PKL KURIKULUM MERDEKA (PERMENDIKBUDRISTEK NO. 12/2024) ───

export interface OfficialElementScoreResult {
  code: string;
  title: string;
  category: "SOFT_SKILLS" | "HARD_SKILLS_CORE" | "HARD_SKILLS_ADVANCED" | "ENTREPRENEURSHIP";
  weight: number;
  score: number;
  predicate: "Sangat Baik" | "Baik" | "Cukup" | "Perlu Bimbingan";
  description: string;
}

export interface OfficialFourElementsGradeInput {
  studentName: string;
  dudiName: string;
  totalVerifiedHours: number;
  attendanceDisciplinePercent?: number; // 0-100
  mentorAttitudeScore?: number; // 0-100 (FR-010)
  technicalElementScores: Array<{
    title: string;
    score: number;
    isAdvanced?: boolean;
  }>;
  entrepreneurshipScore?: number;
}

export interface OfficialFourElementsGradeResult {
  elements: OfficialElementScoreResult[];
  finalGrade: number;
  finalPredicate: string;
  highestAchievement: string;
  needsImprovement: string;
}

/**
 * Menghitung nilai akhir dan struktur 4 Elemen Resmi Mapel PKL sesuai standar BSKAP Kemendikdasmen
 */
export function calculateOfficialFourElementsPklGrade(
  input: OfficialFourElementsGradeInput
): OfficialFourElementsGradeResult {
  const {
    studentName,
    dudiName,
    attendanceDisciplinePercent = 100,
    mentorAttitudeScore = 85,
    technicalElementScores = [],
  } = input;

  // 1. Elemen 1: Internalisasi & Penerapan Soft Skills (Disiplin kehadiran + Etos kerja mentor)
  const softSkillsScore = Math.min(
    100,
    Math.round((0.50 * attendanceDisciplinePercent + 0.50 * mentorAttitudeScore) * 100) / 100
  );

  // 2. Elemen 2: Penerapan Hard Skills (Core technical competencies)
  const coreTechnicalItems = technicalElementScores.filter((t) => !t.isAdvanced);
  const coreScore =
    coreTechnicalItems.length > 0
      ? Math.round(
          (coreTechnicalItems.reduce((acc, curr) => acc + curr.score, 0) / coreTechnicalItems.length) * 100
        ) / 100
      : technicalElementScores.length > 0
      ? technicalElementScores[0]!.score
      : 80;

  // 3. Elemen 3: Peningkatan & Pengembangan Hard Skills (Advanced / problem solving)
  const advancedTechnicalItems = technicalElementScores.filter((t) => t.isAdvanced);
  const advancedScore =
    advancedTechnicalItems.length > 0
      ? Math.round(
          (advancedTechnicalItems.reduce((acc, curr) => acc + curr.score, 0) / advancedTechnicalItems.length) * 100
        ) / 100
      : technicalElementScores.length > 1
      ? technicalElementScores[technicalElementScores.length - 1]!.score
      : coreScore;

  // 4. Elemen 4: Penyiapan Kemandirian Berwirausaha (Proses bisnis DUDI & inisiatif mandiri)
  const entrepreneurshipScore =
    typeof input.entrepreneurshipScore === "number"
      ? input.entrepreneurshipScore
      : Math.min(100, Math.round((mentorAttitudeScore * 0.60 + coreScore * 0.40) * 100) / 100);

  const getPredicate = (s: number): "Sangat Baik" | "Baik" | "Cukup" | "Perlu Bimbingan" =>
    s >= 86 ? "Sangat Baik" : s >= 76 ? "Baik" : s >= 70 ? "Cukup" : "Perlu Bimbingan";

  const elements: OfficialElementScoreResult[] = [
    {
      code: OFFICIAL_PKL_ELEMENT_CODES.SOFT_SKILLS,
      title: OFFICIAL_PKL_ELEMENT_TITLES.SOFT_SKILLS,
      category: "SOFT_SKILLS",
      weight: OFFICIAL_PKL_ELEMENT_WEIGHTS.SOFT_SKILLS,
      score: softSkillsScore,
      predicate: getPredicate(softSkillsScore),
      description: `Menunjukkan kepatuhan K3, integritas, kedisiplinan kerja, dan etos komunikasi tim yang ${getPredicate(softSkillsScore).toLowerCase()} di ${dudiName}.`,
    },
    {
      code: OFFICIAL_PKL_ELEMENT_CODES.HARD_SKILLS_CORE,
      title: OFFICIAL_PKL_ELEMENT_TITLES.HARD_SKILLS_CORE,
      category: "HARD_SKILLS_CORE",
      weight: OFFICIAL_PKL_ELEMENT_WEIGHTS.HARD_SKILLS_CORE,
      score: coreScore,
      predicate: getPredicate(coreScore),
      description: `Kompeten dan mandiri dalam melaksanakan prosedur operasional standar (SOP) pekerjaan kejuruan teknis di industri.`,
    },
    {
      code: OFFICIAL_PKL_ELEMENT_CODES.HARD_SKILLS_ADVANCED,
      title: OFFICIAL_PKL_ELEMENT_TITLES.HARD_SKILLS_ADVANCED,
      category: "HARD_SKILLS_ADVANCED",
      weight: OFFICIAL_PKL_ELEMENT_WEIGHTS.HARD_SKILLS_ADVANCED,
      score: advancedScore,
      predicate: getPredicate(advancedScore),
      description: `Mampu mengeksplorasi penggunaan instrumen kerja spesifik industri serta menyelesaikan penugasan teknis lanjutan.`,
    },
    {
      code: OFFICIAL_PKL_ELEMENT_CODES.ENTREPRENEURSHIP,
      title: OFFICIAL_PKL_ELEMENT_TITLES.ENTREPRENEURSHIP,
      category: "ENTREPRENEURSHIP",
      weight: OFFICIAL_PKL_ELEMENT_WEIGHTS.ENTREPRENEURSHIP,
      score: entrepreneurshipScore,
      predicate: getPredicate(entrepreneurshipScore),
      description: `Memahami alur proses bisnis dan layanan DUDI serta menunjukkan inisiatif dan kemandirian berkarya.`,
    },
  ];

  // Nilai Akhir Berbobot 4 Elemen
  const finalGrade = Math.min(
    100,
    Math.round(
      (softSkillsScore * OFFICIAL_PKL_ELEMENT_WEIGHTS.SOFT_SKILLS +
        coreScore * OFFICIAL_PKL_ELEMENT_WEIGHTS.HARD_SKILLS_CORE +
        advancedScore * OFFICIAL_PKL_ELEMENT_WEIGHTS.HARD_SKILLS_ADVANCED +
        entrepreneurshipScore * OFFICIAL_PKL_ELEMENT_WEIGHTS.ENTREPRENEURSHIP) *
        100
    ) / 100
  );

  const finalPredicate = getPredicate(finalGrade);

  const highestAchievement = `Menunjukkan pencapaian sangat baik dalam ${elements[1]?.title} secara mandiri sesuai standar SOP di ${dudiName}, serta memiliki etos kerja dan disiplin tinggi.`;
  const lowestScoreEl = [...elements].sort((a, b) => a.score - b.score)[0];
  const needsImprovement =
    lowestScoreEl && lowestScoreEl.score < 80
      ? `Perlu penguatan bimbingan berkelanjutan pada elemen ${lowestScoreEl.title}.`
      : `Mampu mempertahankan konsistensi capaian pembelajaran praktik kerja lapangan dengan prima di seluruh 4 elemen kompetensi.`;

  return {
    elements,
    finalGrade,
    finalPredicate,
    highestAchievement,
    needsImprovement,
  };
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
  softSkillsScore?: number;
  hardSkillsCoreScore?: number;
  hardSkillsAdvancedScore?: number;
  entrepreneurshipScore?: number;
}

/**
 * Menghasilkan file teks format CSV resmi siap impor ke aplikasi e-Rapor SMK
 */
export function generateEraporCsv(rows: EraporExportRow[]): string {
  const hasOfficialElements = rows.some((r) => r.softSkillsScore !== undefined);

  const baseHeaders = [
    "NISN",
    "Nama_Siswa",
    "Nama_Mitra_DUDI",
    "Total_JP_Terverifikasi",
    "Nilai_Akhir_PKL",
    "Deskripsi_Capaian_Tertinggi",
    "Deskripsi_Capaian_Perlu_Bimbingan",
  ];

  const headers = hasOfficialElements
    ? [
        ...baseHeaders,
        "Elemen_1_Soft_Skills",
        "Elemen_2_Penerapan_Hard_Skills",
        "Elemen_3_Pengembangan_Hard_Skills",
        "Elemen_4_Kewirausahaan",
      ]
    : baseHeaders;

  const escapeCsv = (val: string | number | undefined) => {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const csvRows = [
    headers.join(","),
    ...rows.map((r) => {
      const baseValues = [
        escapeCsv(r.nisn),
        escapeCsv(r.studentName),
        escapeCsv(r.dudiName),
        escapeCsv(r.totalVerifiedJp),
        escapeCsv(r.finalGrade),
        escapeCsv(r.highestAchievement),
        escapeCsv(r.needsImprovement),
      ];

      if (hasOfficialElements) {
        baseValues.push(
          escapeCsv(r.softSkillsScore ?? ""),
          escapeCsv(r.hardSkillsCoreScore ?? ""),
          escapeCsv(r.hardSkillsAdvancedScore ?? ""),
          escapeCsv(r.entrepreneurshipScore ?? "")
        );
      }

      return baseValues.join(",");
    }),
  ];

  return csvRows.join("\r\n");
}

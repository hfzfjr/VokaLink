/**
 * VokaLink ATS-CV & Skill Passport Generator Core Engine
 * Deterministic pure functions complying with:
 * - BR-010: Only VERIFIED logs are included in technical skill claims & hours
 * - BR-004: Non-competency tasks (Tombol Jujur) are excluded from technical claims,
 *           but counted toward total attendance hours.
 * - ADR-09: Single-column ATS format with XYZ bullet points.
 */

export interface RawLogItemInput {
  jobCardId: string;
  jobCardTitle: string;
  skkniUnitCode?: string | null;
  toolsAndSoftware: string[];
  actionVerbTemplate?: string | null;
  isNonCompetency: boolean;
  durationJp: number;
  autonomyLevel: number; // 1: Observasi, 2: Terbimbing, 3: Mandiri
}

export interface RawLogInput {
  id: string;
  logDate: string | Date;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "REVISION_REQUIRED" | string;
  placementId: string;
  dudiName: string;
  dudiCity?: string | null;
  mentorName?: string | null;
  items: RawLogItemInput[];
}

export interface CvBulletPoint {
  jobCardId: string;
  jobCardTitle: string;
  skkniUnitCode: string | null;
  totalJp: number;
  taskCount: number;
  predominantAutonomyLevel: 1 | 2 | 3;
  autonomyLabel: "Mandiri" | "Terbimbing" | "Observasi";
  toolsUsed: string[];
  bulletText: string;
}

export interface CvWorkExperience {
  placementId: string;
  dudiName: string;
  dudiCity?: string;
  roleTitle: string;
  periodLabel: string;
  mentorName?: string;
  totalVerifiedJp: number;
  technicalJp: number;
  nonCompetencyJp: number;
  bulletPoints: CvBulletPoint[];
}

export interface CvSkillItem {
  name: string;
  totalJp: number;
}

export interface CvEndorsementSummary {
  attitudeScore: number;
  badges: string[];
  quote: string | null;
  mentorName: string;
  dudiName: string;
}

export interface GeneratedCvResult {
  totalVerifiedJp: number;
  technicalJp: number;
  nonCompetencyJp: number;
  experiences: CvWorkExperience[];
  technicalSkills: CvSkillItem[];
  defaultSummaryBio: string;
  verifiedDatesCount: number;
  skkniUnitsCount: number;
}

/**
 * Returns autonomy description text for XYZ bullet point.
 */
export function getAutonomyAdverb(level: 1 | 2 | 3): string {
  switch (level) {
    case 3:
      return "secara mandiri";
    case 2:
      return "secara terbimbing";
    case 1:
    default:
      return "melalui observasi langsung";
  }
}

/**
 * Formulates a single ATS bullet point following Google XYZ formula:
 * Accomplished [X] as measured by [Y], by doing [Z].
 */
export function generateXyzBulletPoint(params: {
  actionVerbTemplate?: string | null;
  toolsAndSoftware: string[];
  jobCardTitle: string;
  skkniUnitCode?: string | null;
  totalJp: number;
  taskCount: number;
  autonomyLevel: 1 | 2 | 3;
}): string {
  const {
    actionVerbTemplate,
    toolsAndSoftware,
    jobCardTitle,
    skkniUnitCode,
    totalJp,
    taskCount,
    autonomyLevel,
  } = params;

  const autonomyText = getAutonomyAdverb(autonomyLevel);
  const toolsText =
    toolsAndSoftware.length > 0
      ? ` menggunakan ${toolsAndSoftware.slice(0, 3).join(", ")}`
      : "";

  const actionText = actionVerbTemplate?.trim()
    ? actionVerbTemplate.trim()
    : `Melaksanakan penugasan ${jobCardTitle}`;

  const skkniText = skkniUnitCode ? ` (SKKNI: ${skkniUnitCode})` : "";
  const taskCountText = taskCount > 1 ? ` melalui ${taskCount} penugasan` : "";

  return `${actionText}${toolsText} untuk ${jobCardTitle} ${autonomyText}${taskCountText} dengan akumulasi ${totalJp} JP kerja terverifikasi${skkniText}.`;
}

/**
 * Transforms raw daily logs into structured, ATS-compliant CV data.
 * Adheres strictly to BR-010 (only VERIFIED logs) & BR-004 (Tombol Jujur exclusion from technical claims).
 */
export function generateCvFromLogs(params: {
  logs: RawLogInput[];
  studentDepartment?: string;
  customRoleTitle?: string;
}): GeneratedCvResult {
  const { logs, studentDepartment = "Rekayasa Perangkat Lunak", customRoleTitle } = params;

  // 1. Filter ONLY VERIFIED logs (BR-010)
  const verifiedLogs = logs.filter((log) => log.status === "VERIFIED");

  let grandTotalVerifiedJp = 0;
  let grandTechnicalJp = 0;
  let grandNonCompetencyJp = 0;

  const uniqueDates = new Set<string>();
  const uniqueSkkniUnits = new Set<string>();
  const skillJpMap = new Map<string, number>();

  // 2. Group verified logs by placement (DUDI)
  const placementMap = new Map<
    string,
    {
      placementId: string;
      dudiName: string;
      dudiCity?: string;
      mentorName?: string;
      dates: Date[];
      items: RawLogItemInput[];
    }
  >();

  for (const log of verifiedLogs) {
    const logDateStr =
      typeof log.logDate === "string"
        ? log.logDate.slice(0, 10)
        : log.logDate.toISOString().slice(0, 10);
    uniqueDates.add(logDateStr);

    let group = placementMap.get(log.placementId);
    if (!group) {
      group = {
        placementId: log.placementId,
        dudiName: log.dudiName,
        dudiCity: log.dudiCity || undefined,
        mentorName: log.mentorName || undefined,
        dates: [],
        items: [],
      };
      placementMap.set(log.placementId, group);
    }

    group.dates.push(new Date(log.logDate));
    for (const item of log.items) {
      group.items.push(item);
    }
  }

  // 3. Process each placement
  const experiences: CvWorkExperience[] = [];

  for (const group of placementMap.values()) {
    let placementTechnicalJp = 0;
    let placementNonCompJp = 0;

    // Group items by jobCardId
    const jobCardGroups = new Map<
      string,
      {
        jobCardId: string;
        jobCardTitle: string;
        skkniUnitCode: string | null;
        toolsAndSoftware: Set<string>;
        actionVerbTemplate: string | null;
        isNonCompetency: boolean;
        totalJp: number;
        taskCount: number;
        autonomySum: number;
        maxAutonomy: 1 | 2 | 3;
      }
    >();

    for (const item of group.items) {
      if (item.isNonCompetency) {
        placementNonCompJp += item.durationJp;
        grandNonCompetencyJp += item.durationJp;
        grandTotalVerifiedJp += item.durationJp;
        // Non-competency item excluded from technical jobCardGroups & skill map (BR-004)
        continue;
      }

      placementTechnicalJp += item.durationJp;
      grandTechnicalJp += item.durationJp;
      grandTotalVerifiedJp += item.durationJp;

      if (item.skkniUnitCode) {
        uniqueSkkniUnits.add(item.skkniUnitCode);
      }

      // Track technical skills
      for (const tool of item.toolsAndSoftware) {
        const cleaned = tool.trim();
        if (cleaned) {
          const current = skillJpMap.get(cleaned) || 0;
          skillJpMap.set(cleaned, current + item.durationJp);
        }
      }

      let jcGroup = jobCardGroups.get(item.jobCardId);
      if (!jcGroup) {
        jcGroup = {
          jobCardId: item.jobCardId,
          jobCardTitle: item.jobCardTitle,
          skkniUnitCode: item.skkniUnitCode || null,
          toolsAndSoftware: new Set(),
          actionVerbTemplate: item.actionVerbTemplate || null,
          isNonCompetency: false,
          totalJp: 0,
          taskCount: 0,
          autonomySum: 0,
          maxAutonomy: (Math.max(1, Math.min(3, item.autonomyLevel)) as 1 | 2 | 3),
        };
        jobCardGroups.set(item.jobCardId, jcGroup);
      }

      jcGroup.totalJp += item.durationJp;
      jcGroup.taskCount += 1;
      jcGroup.autonomySum += item.autonomyLevel;
      jcGroup.maxAutonomy = Math.max(jcGroup.maxAutonomy, item.autonomyLevel) as 1 | 2 | 3;

      for (const tool of item.toolsAndSoftware) {
        if (tool.trim()) jcGroup.toolsAndSoftware.add(tool.trim());
      }
    }

    // Sort job cards by total JP descending
    const sortedJobCards = Array.from(jobCardGroups.values()).sort(
      (a, b) => b.totalJp - a.totalJp
    );

    const bulletPoints: CvBulletPoint[] = sortedJobCards.map((jc) => {
      // Calculate predominant autonomy level (average rounded or max)
      const avgAutonomy = Math.round(jc.autonomySum / Math.max(1, jc.taskCount));
      const predominantAutonomyLevel = (Math.max(1, Math.min(3, avgAutonomy)) as 1 | 2 | 3);
      const autonomyLabel =
        predominantAutonomyLevel === 3
          ? "Mandiri"
          : predominantAutonomyLevel === 2
          ? "Terbimbing"
          : "Observasi";

      const toolsArray = Array.from(jc.toolsAndSoftware);

      const bulletText = generateXyzBulletPoint({
        actionVerbTemplate: jc.actionVerbTemplate,
        toolsAndSoftware: toolsArray,
        jobCardTitle: jc.jobCardTitle,
        skkniUnitCode: jc.skkniUnitCode,
        totalJp: jc.totalJp,
        taskCount: jc.taskCount,
        autonomyLevel: predominantAutonomyLevel,
      });

      return {
        jobCardId: jc.jobCardId,
        jobCardTitle: jc.jobCardTitle,
        skkniUnitCode: jc.skkniUnitCode,
        totalJp: jc.totalJp,
        taskCount: jc.taskCount,
        predominantAutonomyLevel,
        autonomyLabel,
        toolsUsed: toolsArray,
        bulletText,
      };
    });

    // Format date period
    let periodLabel = "Jan 2026 – Sekarang";
    if (group.dates.length > 0) {
      const sortedDates = [...group.dates].sort((a, b) => a.getTime() - b.getTime());
      const first = sortedDates[0];
      const last = sortedDates[sortedDates.length - 1];
      if (first && last) {
        const monthNames = [
          "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
          "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
        ];
        const startStr = `${monthNames[first.getMonth()]} ${first.getFullYear()}`;
        const endStr = `${monthNames[last.getMonth()]} ${last.getFullYear()}`;
        periodLabel = startStr === endStr ? startStr : `${startStr} – ${endStr}`;
      }
    }

    const roleTitle = customRoleTitle || `Praktik Kerja Lapangan — ${studentDepartment}`;

    experiences.push({
      placementId: group.placementId,
      dudiName: group.dudiName,
      dudiCity: group.dudiCity,
      roleTitle,
      periodLabel,
      mentorName: group.mentorName,
      totalVerifiedJp: placementTechnicalJp + placementNonCompJp,
      technicalJp: placementTechnicalJp,
      nonCompetencyJp: placementNonCompJp,
      bulletPoints,
    });
  }

  // 4. Sort skills by total JP descending
  const technicalSkills: CvSkillItem[] = Array.from(skillJpMap.entries())
    .map(([name, totalJp]) => ({ name, totalJp }))
    .sort((a, b) => b.totalJp - a.totalJp);

  // 5. Default professional bio summary
  const topSkillsList = technicalSkills.slice(0, 4).map((s) => s.name);
  const primaryDudi = experiences[0]?.dudiName || "Industri Mitra";
  const skillsPhrase =
    topSkillsList.length > 0
      ? `, menguasai spesialisasi ${topSkillsList.join(", ")}`
      : "";
  const skkniPhrase =
    uniqueSkkniUnits.size > 0
      ? ` dengan capaian ${uniqueSkkniUnits.size} unit kompetensi SKKNI`
      : "";

  const defaultSummaryBio = `Siswa SMK jurusan ${studentDepartment} dengan pengalaman praktik industri selama ${grandTotalVerifiedJp} JP terverifikasi resmi di ${primaryDudi}${skillsPhrase}${skkniPhrase}.`;

  return {
    totalVerifiedJp: grandTotalVerifiedJp,
    technicalJp: grandTechnicalJp,
    nonCompetencyJp: grandNonCompetencyJp,
    experiences,
    technicalSkills,
    defaultSummaryBio,
    verifiedDatesCount: uniqueDates.size,
    skkniUnitsCount: uniqueSkkniUnits.size,
  };
}

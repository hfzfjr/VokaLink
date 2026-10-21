import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { Prisma, PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface JobCardSeed {
  title: string;
  skkniUnitCode: string | null;
  toolsAndSoftware: string[];
  actionVerbTemplate: string;
  isNonCompetency: boolean;
}

export interface CpElementSeed {
  code: string;
  title: string;
  targetJp: number;
  sortOrder: number;
  jobCards: JobCardSeed[];
}

export interface DeptCurriculumSeed {
  _jurusan: string;
  sectorCode: string;
  cpElements: CpElementSeed[];
  nonCompetencyJobCards: JobCardSeed[];
}

export interface MasterDeptSeed {
  sectorCode: string;
  name: string;
  description: string;
}

export interface CurriculumSeedFile {
  masterDepartments: MasterDeptSeed[];
  curriculum: DeptCurriculumSeed[];
}

let cachedSeedData: CurriculumSeedFile | null = null;

export function getCurriculumSeedData(): CurriculumSeedFile {
  if (cachedSeedData) return cachedSeedData;
  // Locate curriculum-seed.json in prisma directory
  const seedPath = join(__dirname, "../../prisma/curriculum-seed.json");
  const raw = readFileSync(seedPath, "utf-8");
  cachedSeedData = JSON.parse(raw) as CurriculumSeedFile;
  return cachedSeedData;
}

/**
 * Returns available master departments from seed data
 */
export function getMasterDepartmentsList(): MasterDeptSeed[] {
  return getCurriculumSeedData().masterDepartments;
}

/**
 * Clones curriculum (SchoolDepartment, CpElement, and JobCards) for a newly registered school.
 */
export async function cloneCurriculumForSchool(
  client: PrismaClient | Prisma.TransactionClient,
  schoolId: string,
  sectorCodes: string[]
) {
  const seedData = getCurriculumSeedData();
  const createdDepartments = [];

  for (const sectorCode of sectorCodes) {
    const deptSeed = seedData.curriculum.find(
      (d) => d.sectorCode.toUpperCase() === sectorCode.toUpperCase()
    );
    const masterDept = seedData.masterDepartments.find(
      (d) => d.sectorCode.toUpperCase() === sectorCode.toUpperCase()
    );

    if (!deptSeed) {
      continue;
    }

    // Find master department record if exists
    const masterRecord = await client.masterDepartment.findUnique({
      where: { sectorCode: deptSeed.sectorCode },
    });

    // 1. Create School Department
    const schoolDept = await client.schoolDepartment.create({
      data: {
        schoolId,
        masterDepartmentId: masterRecord?.id ?? null,
        sectorCode: deptSeed.sectorCode,
        name: masterDept?.name ?? deptSeed.sectorCode,
        isLocked: false,
      },
    });

    createdDepartments.push(schoolDept);

    // 2. Create CpElements and Competency Job Cards
    for (const cp of deptSeed.cpElements) {
      const createdCp = await client.cpElement.create({
        data: {
          schoolDepartmentId: schoolDept.id,
          code: cp.code,
          title: cp.title,
          targetJp: cp.targetJp,
          sortOrder: cp.sortOrder,
        },
      });

      for (const jc of cp.jobCards) {
        await client.jobCard.create({
          data: {
            schoolDepartmentId: schoolDept.id,
            cpElementId: createdCp.id,
            title: jc.title.slice(0, 60),
            skkniUnitCode: jc.skkniUnitCode,
            toolsAndSoftware: jc.toolsAndSoftware,
            actionVerbTemplate: jc.actionVerbTemplate,
            isNonCompetency: false,
          },
        });
      }
    }

    // 3. Create Non-Competency Job Cards (BR-004)
    if (deptSeed.nonCompetencyJobCards && deptSeed.nonCompetencyJobCards.length > 0) {
      for (const nc of deptSeed.nonCompetencyJobCards) {
        await client.jobCard.create({
          data: {
            schoolDepartmentId: schoolDept.id,
            cpElementId: null,
            title: nc.title.slice(0, 60),
            skkniUnitCode: null,
            toolsAndSoftware: nc.toolsAndSoftware,
            actionVerbTemplate: nc.actionVerbTemplate,
            isNonCompetency: true,
          },
        });
      }
    } else {
      // Fallback non-competency card if not provided in array
      await client.jobCard.create({
        data: {
          schoolDepartmentId: schoolDept.id,
          cpElementId: null,
          title: "Bantuan Operasional Umum (Non-Jurusan)",
          skkniUnitCode: null,
          toolsAndSoftware: [],
          actionVerbTemplate: "Membantu tugas operasional umum selama [durasi] menit",
          isNonCompetency: true,
        },
      });
    }
  }

  return createdDepartments;
}

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

export interface CustomDepartmentMeta {
  sectorCode: string;
  name: string;
  description?: string;
}

function buildDefaultCustomCurriculum(code: string, name: string): DeptCurriculumSeed {
  const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "") || "SMK";
  return {
    _jurusan: name,
    sectorCode: cleanCode,
    cpElements: [
      {
        code: `${cleanCode}-CP-01`,
        title: `Internalisasi dan Penerapan Soft Skills (${name})`,
        targetJp: 180,
        sortOrder: 1,
        jobCards: [
          {
            title: "Penerapan K3LH & Budaya Kerja Industri",
            skkniUnitCode: null,
            toolsAndSoftware: ["APD Standar", "SOP Perusahaan"],
            actionVerbTemplate: "Menerapkan prosedur K3LH dan budaya kerja industri selama [durasi] menit",
            isNonCompetency: false,
          },
          {
            title: "Komunikasi & Koordinasi Tim Kerja",
            skkniUnitCode: null,
            toolsAndSoftware: ["Logbook Kerja", "Media Komunikasi"],
            actionVerbTemplate: "Melaksanakan koordinasi dan komunikasi efektif bersama tim selama [durasi] menit",
            isNonCompetency: false,
          },
        ],
      },
      {
        code: `${cleanCode}-CP-02`,
        title: `Penerapan Hard Skills & Kompetensi Teknis ${name}`,
        targetJp: 324,
        sortOrder: 2,
        jobCards: [
          {
            title: `Pelaksanaan Tugas Teknis Utama ${name}`.slice(0, 60),
            skkniUnitCode: null,
            toolsAndSoftware: ["Peralatan Kerja Standar", "Perangkat Teknis"],
            actionVerbTemplate: `Melaksanakan pekerjaan teknis ${name} sesuai SOP selama [durasi] menit`,
            isNonCompetency: false,
          },
          {
            title: "Pengoperasian Alat & Perangkat Kerja Kejuruan",
            skkniUnitCode: null,
            toolsAndSoftware: ["Instrumen Teknis", "Manual Operasional"],
            actionVerbTemplate: "Mengoperasikan peralatan dan instrumen teknis kejuruan selama [durasi] menit",
            isNonCompetency: false,
          },
          {
            title: "Pemeriksaan Mutu & Evaluasi Hasil Pekerjaan",
            skkniUnitCode: null,
            toolsAndSoftware: ["Checklist QC", "Form Pemeriksaan"],
            actionVerbTemplate: "Memeriksa kualitas dan ketepatan hasil kerja teknis selama [durasi] menit",
            isNonCompetency: false,
          },
        ],
      },
      {
        code: `${cleanCode}-CP-03`,
        title: `Pengembangan & Pemecahan Masalah Teknis ${name}`,
        targetJp: 180,
        sortOrder: 3,
        jobCards: [
          {
            title: "Troubleshooting & Perbaikan Kendala Teknis",
            skkniUnitCode: null,
            toolsAndSoftware: ["Alat Diagnostik", "Log Perbaikan"],
            actionVerbTemplate: "Mengidentifikasi dan menangani kendala teknis operasional selama [durasi] menit",
            isNonCompetency: false,
          },
          {
            title: "Dokumentasi & Pelaporan Teknis Pekerjaan",
            skkniUnitCode: null,
            toolsAndSoftware: ["Aplikasi Perkantoran", "Formulir Laporan"],
            actionVerbTemplate: "Menyusun dokumentasi dan laporan hasil pekerjaan teknis selama [durasi] menit",
            isNonCompetency: false,
          },
        ],
      },
      {
        code: `${cleanCode}-CP-04`,
        title: "Kemandirian & Wawasan Kewirausahaan Industri",
        targetJp: 108,
        sortOrder: 4,
        jobCards: [
          {
            title: "Layanan Pelanggan & Proyek Proses Bisnis",
            skkniUnitCode: null,
            toolsAndSoftware: ["SOP Layanan", "Sistem Manajemen"],
            actionVerbTemplate: "Melaksanakan alur layanan dan proses bisnis industri selama [durasi] menit",
            isNonCompetency: false,
          },
        ],
      },
    ],
    nonCompetencyJobCards: [
      {
        title: "Bantuan Operasional Umum (Non-Jurusan)",
        skkniUnitCode: null,
        toolsAndSoftware: [],
        actionVerbTemplate: "Membantu tugas operasional umum selama [durasi] menit",
        isNonCompetency: true,
      },
    ],
  };
}

/**
 * Clones curriculum (SchoolDepartment, CpElement, and JobCards) for a newly registered school.
 */
export async function cloneCurriculumForSchool(
  client: PrismaClient | Prisma.TransactionClient,
  schoolId: string,
  sectorCodes: string[],
  customDepartments: CustomDepartmentMeta[] = []
) {
  const seedData = getCurriculumSeedData();
  const createdDepartments = [];

  for (const sectorCode of sectorCodes) {
    let deptSeed = seedData.curriculum.find(
      (d) => d.sectorCode.toUpperCase() === sectorCode.toUpperCase()
    );
    const masterDept = seedData.masterDepartments.find(
      (d) => d.sectorCode.toUpperCase() === sectorCode.toUpperCase()
    );
    const customDept = customDepartments.find(
      (d) => d.sectorCode.toUpperCase() === sectorCode.toUpperCase()
    );

    const resolvedSectorCode = (
      deptSeed?.sectorCode ??
      customDept?.sectorCode ??
      sectorCode
    ).toUpperCase();
    const resolvedName =
      masterDept?.name ?? customDept?.name ?? deptSeed?._jurusan ?? resolvedSectorCode;

    if (!deptSeed) {
      deptSeed = buildDefaultCustomCurriculum(resolvedSectorCode, resolvedName);
    }

    // Find master department record if exists
    const masterRecord = await client.masterDepartment.findUnique({
      where: { sectorCode: resolvedSectorCode },
    });

    // 1. Create School Department
    const schoolDept = await client.schoolDepartment.create({
      data: {
        schoolId,
        masterDepartmentId: masterRecord?.id ?? null,
        sectorCode: resolvedSectorCode,
        name: resolvedName,
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

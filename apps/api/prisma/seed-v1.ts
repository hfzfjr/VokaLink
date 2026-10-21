/**
 * seed-v1.ts — VokaLink Seeder v1
 *
 * Populate: 1 sekolah demo (sandbox), 6 jurusan dari curriculum-seed.json,
 * 1 guru, 5 siswa (masing-masing di jurusan RPL), 6 DUDI + mentor terikat,
 * dan 5 penempatan aktif (siswa → DUDI).
 *
 * Jalankan: pnpm --filter api seed:v1
 *
 * Prasyarat:
 *   - Database sudah termigrasi (prisma migrate deploy)
 *   - FILE .env sudah terisi DATABASE_URL dan DIRECT_URL
 */

import { PrismaClient, UserRole, PlacementStatus } from "@prisma/client";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobCardSeed {
  title: string;
  skkniUnitCode: string | null;
  toolsAndSoftware: string[];
  actionVerbTemplate: string;
  isNonCompetency: boolean;
}

interface CpElementSeed {
  code: string;
  title: string;
  targetJp: number;
  sortOrder: number;
  jobCards: JobCardSeed[];
}

interface DeptCurriculumSeed {
  _jurusan: string;
  sectorCode: string;
  cpElements: CpElementSeed[];
  nonCompetencyJobCards: JobCardSeed[];
}

interface MasterDeptSeed {
  sectorCode: string;
  name: string;
  description: string;
}

interface CurriculumSeedFile {
  masterDepartments: MasterDeptSeed[];
  curriculum: DeptCurriculumSeed[];
}

// ─── Load curriculum seed ─────────────────────────────────────────────────────

const seedFilePath = join(__dirname, "curriculum-seed.json");
const curriculumData = JSON.parse(
  readFileSync(seedFilePath, "utf-8")
) as CurriculumSeedFile;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Buat UUID deterministik dari string (untuk idempotency seed) */
function deterministicUuid(seed: string): string {
  const hash = createHash("sha256").update(seed).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16), // versi 4
    ((parseInt(hash[16], 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}

// ─── Konstanta ID demo (deterministik agar re-run idempoten) ─────────────────

const SCHOOL_ID = deterministicUuid("vokalink-demo-school-v1");
const PERIOD_ID = deterministicUuid("vokalink-demo-period-2026");
const TEACHER_ID = deterministicUuid("vokalink-demo-teacher-budi");
const STUDENT_IDS = [
  deterministicUuid("vokalink-demo-student-1-andi"),
  deterministicUuid("vokalink-demo-student-2-bintang"),
  deterministicUuid("vokalink-demo-student-3-citra"),
  deterministicUuid("vokalink-demo-student-4-dewi"),
  deterministicUuid("vokalink-demo-student-5-eko"),
];

const DUDI_IDS = [
  deterministicUuid("vokalink-demo-dudi-1-softwarehouse"),
  deterministicUuid("vokalink-demo-dudi-2-startup"),
  deterministicUuid("vokalink-demo-dudi-3-studio"),
  deterministicUuid("vokalink-demo-dudi-4-bengkel"),
  deterministicUuid("vokalink-demo-dudi-5-apotek"),
  deterministicUuid("vokalink-demo-dudi-6-resto"),
];

const MENTOR_IDS = [
  deterministicUuid("vokalink-demo-mentor-1"),
  deterministicUuid("vokalink-demo-mentor-2"),
  deterministicUuid("vokalink-demo-mentor-3"),
  deterministicUuid("vokalink-demo-mentor-4"),
  deterministicUuid("vokalink-demo-mentor-5"),
  deterministicUuid("vokalink-demo-mentor-6"),
];

// ─── Data demo ────────────────────────────────────────────────────────────────

const DEMO_SCHOOL = {
  id: SCHOOL_ID,
  npsn: "99000001",
  name: "SMK Demo VokaLink",
  province: "Jawa Timur",
  city: "Surabaya",
  latitude: -7.2575,
  longitude: 112.7521,
  isDemoSandbox: true,
};

const DEMO_PERIOD = {
  id: PERIOD_ID,
  schoolId: SCHOOL_ID,
  name: "PKL Semester Genap 2025/2026",
  startDate: new Date("2026-01-06"),
  endDate: new Date("2026-06-27"),
  targetTotalJp: 792,
  isActive: true,
};

const DEMO_TEACHER = {
  id: TEACHER_ID,
  schoolId: SCHOOL_ID,
  role: UserRole.TEACHER as UserRole,
  fullName: "Budi Santoso, S.Kom",
  identityNumber: "197501012000011001",
  whatsappNumber: "6281234567890",
};

const DEMO_STUDENTS = [
  {
    id: STUDENT_IDS[0],
    fullName: "Andi Pratama",
    identityNumber: "0078901234",
    whatsappNumber: "6281298765001",
    homeLatitude: -7.2451,
    homeLongitude: 112.7378,
  },
  {
    id: STUDENT_IDS[1],
    fullName: "Bintang Ramadhan",
    identityNumber: "0078901235",
    whatsappNumber: "6281298765002",
    homeLatitude: -7.2612,
    homeLongitude: 112.7489,
  },
  {
    id: STUDENT_IDS[2],
    fullName: "Citra Maharani",
    identityNumber: "0078901236",
    whatsappNumber: "6281298765003",
    homeLatitude: -7.2534,
    homeLongitude: 112.7601,
  },
  {
    id: STUDENT_IDS[3],
    fullName: "Dewi Anggraini",
    identityNumber: "0078901237",
    whatsappNumber: "6281298765004",
    homeLatitude: -7.2389,
    homeLongitude: 112.7412,
  },
  {
    id: STUDENT_IDS[4],
    fullName: "Eko Saputra",
    identityNumber: "0078901238",
    whatsappNumber: "6281298765005",
    homeLatitude: -7.2698,
    homeLongitude: 112.7534,
  },
];

const DEMO_DUDIS = [
  {
    id: DUDI_IDS[0],
    name: "PT Nusantara Tech",
    sectorCategory: "Teknologi Informasi",
    address: "Jl. Raya Darmo No. 45, Surabaya",
    city: "Surabaya",
    latitude: -7.2821,
    longitude: 112.7328,
    maxQuota: 5,
    mentorId: MENTOR_IDS[0],
    mentorName: "Rizky Firmansyah",
    mentorJobTitle: "Engineering Lead",
    mentorWhatsapp: "6281388881001",
  },
  {
    id: DUDI_IDS[1],
    name: "Startup Digital Kreatif",
    sectorCategory: "Teknologi Informasi",
    address: "Ruko Manyar Kertoadi No. 12, Surabaya",
    city: "Surabaya",
    latitude: -7.2654,
    longitude: 112.7712,
    maxQuota: 4,
    mentorId: MENTOR_IDS[1],
    mentorName: "Dian Permata",
    mentorJobTitle: "Head of Product",
    mentorWhatsapp: "6281388881002",
  },
  {
    id: DUDI_IDS[2],
    name: "Studio Kreatif Wirajaya",
    sectorCategory: "Desain dan Kreatif",
    address: "Jl. Basuki Rahmat No. 78, Surabaya",
    city: "Surabaya",
    latitude: -7.2567,
    longitude: 112.7456,
    maxQuota: 3,
    mentorId: MENTOR_IDS[2],
    mentorName: "Hendra Wijaya",
    mentorJobTitle: "Creative Director",
    mentorWhatsapp: "6281388881003",
  },
  {
    id: DUDI_IDS[3],
    name: "Bengkel Otomotif Maju Bersama",
    sectorCategory: "Otomotif",
    address: "Jl. Ahmad Yani No. 221, Surabaya",
    city: "Surabaya",
    latitude: -7.3124,
    longitude: 112.7389,
    maxQuota: 6,
    mentorId: MENTOR_IDS[3],
    mentorName: "Agus Wahyudi",
    mentorJobTitle: "Kepala Mekanik",
    mentorWhatsapp: "6281388881004",
  },
  {
    id: DUDI_IDS[4],
    name: "Apotek Sehat Sentosa",
    sectorCategory: "Kesehatan dan Farmasi",
    address: "Jl. Rungkut Industri No. 5, Surabaya",
    city: "Surabaya",
    latitude: -7.3245,
    longitude: 112.7789,
    maxQuota: 4,
    mentorId: MENTOR_IDS[4],
    mentorName: "apt. Siti Rahayu",
    mentorJobTitle: "Apoteker Penanggung Jawab",
    mentorWhatsapp: "6281388881005",
  },
  {
    id: DUDI_IDS[5],
    name: "Restoran Nusantara Indah",
    sectorCategory: "Pariwisata dan Kuliner",
    address: "Jl. Pemuda No. 33, Surabaya",
    city: "Surabaya",
    latitude: -7.2478,
    longitude: 112.7523,
    maxQuota: 6,
    mentorId: MENTOR_IDS[5],
    mentorName: "Chef Bambang Setiawan",
    mentorJobTitle: "Head Chef",
    mentorWhatsapp: "6281388881006",
  },
];

// ─── Main seed function ───────────────────────────────────────────────────────

async function main() {
  console.log("🌱 VokaLink Seeder v1 — mulai...\n");

  // 1. Upsert MasterDepartments dari curriculum-seed.json
  console.log("📚 Menyimpan MasterDepartments...");
  const masterDeptMap = new Map<string, string>(); // sectorCode → id

  for (const dept of curriculumData.masterDepartments) {
    const id = deterministicUuid(`master-dept-${dept.sectorCode}`);
    masterDeptMap.set(dept.sectorCode, id);

    await prisma.masterDepartment.upsert({
      where: { sectorCode: dept.sectorCode },
      create: {
        id,
        sectorCode: dept.sectorCode,
        name: dept.name,
        description: dept.description,
      },
      update: {
        name: dept.name,
        description: dept.description,
      },
    });
  }
  console.log(`   ✅ ${curriculumData.masterDepartments.length} MasterDepartments disimpan\n`);

  // 2. Upsert Demo School
  console.log("🏫 Menyimpan sekolah demo...");
  await prisma.school.upsert({
    where: { npsn: DEMO_SCHOOL.npsn },
    create: DEMO_SCHOOL,
    update: {
      name: DEMO_SCHOOL.name,
      isDemoSandbox: true,
    },
  });
  console.log(`   ✅ ${DEMO_SCHOOL.name} (NPSN: ${DEMO_SCHOOL.npsn})\n`);

  // 3. Upsert AcademicPeriod
  console.log("📅 Menyimpan periode akademik...");
  await prisma.academicPeriod.upsert({
    where: { id: PERIOD_ID },
    create: DEMO_PERIOD,
    update: {
      name: DEMO_PERIOD.name,
      isActive: true,
    },
  });
  console.log(`   ✅ ${DEMO_PERIOD.name}\n`);

  // 4. Upsert SchoolDepartments dan CpElements + JobCards
  console.log("🗂️ Menyimpan jurusan, elemen CP, dan Job Cards...");
  const schoolDeptMap = new Map<string, string>(); // sectorCode → schoolDeptId

  for (const deptCurr of curriculumData.curriculum) {
    const masterDeptId = masterDeptMap.get(deptCurr.sectorCode);
    const schoolDeptId = deterministicUuid(
      `school-dept-${SCHOOL_ID}-${deptCurr.sectorCode}`
    );
    schoolDeptMap.set(deptCurr.sectorCode, schoolDeptId);

    // Cari nama dari masterDepartments
    const masterDept = curriculumData.masterDepartments.find(
      (d) => d.sectorCode === deptCurr.sectorCode
    );

    await prisma.schoolDepartment.upsert({
      where: { id: schoolDeptId },
      create: {
        id: schoolDeptId,
        schoolId: SCHOOL_ID,
        masterDepartmentId: masterDeptId ?? null,
        sectorCode: deptCurr.sectorCode,
        name: masterDept?.name ?? deptCurr.sectorCode,
        isLocked: false,
      },
      update: {
        name: masterDept?.name ?? deptCurr.sectorCode,
      },
    });

    // Upsert CpElements dan JobCards
    for (const cp of deptCurr.cpElements) {
      const cpId = deterministicUuid(
        `cp-${schoolDeptId}-${cp.code}`
      );

      await prisma.cpElement.upsert({
        where: { id: cpId },
        create: {
          id: cpId,
          schoolDepartmentId: schoolDeptId,
          code: cp.code,
          title: cp.title,
          targetJp: cp.targetJp,
          sortOrder: cp.sortOrder,
        },
        update: {
          title: cp.title,
          targetJp: cp.targetJp,
          sortOrder: cp.sortOrder,
        },
      });

      for (const jc of cp.jobCards) {
        const jcId = deterministicUuid(
          `jc-${cpId}-${jc.title.slice(0, 30)}`
        );

        await prisma.jobCard.upsert({
          where: { id: jcId },
          create: {
            id: jcId,
            schoolDepartmentId: schoolDeptId,
            cpElementId: cpId,
            title: jc.title.slice(0, 60),
            skkniUnitCode: jc.skkniUnitCode,
            toolsAndSoftware: jc.toolsAndSoftware,
            actionVerbTemplate: jc.actionVerbTemplate,
            isNonCompetency: false,
          },
          update: {
            title: jc.title.slice(0, 60),
            toolsAndSoftware: jc.toolsAndSoftware,
          },
        });
      }
    }

    // Upsert non-competency JobCards (tanpa cpElementId)
    for (const nc of deptCurr.nonCompetencyJobCards) {
      const ncId = deterministicUuid(
        `nc-jc-${schoolDeptId}-${nc.title.slice(0, 30)}`
      );

      await prisma.jobCard.upsert({
        where: { id: ncId },
        create: {
          id: ncId,
          schoolDepartmentId: schoolDeptId,
          cpElementId: null,
          title: nc.title.slice(0, 60),
          skkniUnitCode: null,
          toolsAndSoftware: nc.toolsAndSoftware,
          actionVerbTemplate: nc.actionVerbTemplate,
          isNonCompetency: true,
        },
        update: {
          title: nc.title.slice(0, 60),
        },
      });
    }
  }

  // Hitung total
  const totalCp = curriculumData.curriculum.reduce(
    (acc, d) => acc + d.cpElements.length,
    0
  );
  const totalJc = curriculumData.curriculum.reduce(
    (acc, d) =>
      acc +
      d.cpElements.reduce((a, cp) => a + cp.jobCards.length, 0) +
      d.nonCompetencyJobCards.length,
    0
  );
  console.log(
    `   ✅ 6 SchoolDepartments, ${totalCp} CpElements, ${totalJc} JobCards disimpan\n`
  );

  // 5. Upsert Teacher (Supabase Auth user harus sudah ada — gunakan ID dummy untuk seed)
  console.log("👨‍🏫 Menyimpan guru demo...");
  const rplDeptId = schoolDeptMap.get("RPL")!;

  await prisma.userProfile.upsert({
    where: { id: TEACHER_ID },
    create: {
      ...DEMO_TEACHER,
      schoolDepartmentId: rplDeptId,
    },
    update: {
      fullName: DEMO_TEACHER.fullName,
    },
  });
  console.log(`   ✅ ${DEMO_TEACHER.fullName}\n`);

  // 6. Upsert Students (semua di jurusan RPL untuk demo)
  console.log("👨‍🎓 Menyimpan siswa demo...");
  for (const student of DEMO_STUDENTS) {
    await prisma.userProfile.upsert({
      where: { id: student.id },
      create: {
        id: student.id,
        schoolId: SCHOOL_ID,
        schoolDepartmentId: rplDeptId,
        role: UserRole.STUDENT,
        fullName: student.fullName,
        identityNumber: student.identityNumber,
        whatsappNumber: student.whatsappNumber,
        homeLatitude: student.homeLatitude,
        homeLongitude: student.homeLongitude,
      },
      update: {
        fullName: student.fullName,
      },
    });
    console.log(`   ✅ ${student.fullName}`);
  }
  console.log();

  // 7. Upsert DudiPartners + Mentors
  console.log("🏢 Menyimpan DUDI dan mentor...");
  for (const dudi of DEMO_DUDIS) {
    await prisma.dudiPartner.upsert({
      where: { id: dudi.id },
      create: {
        id: dudi.id,
        createdBySchoolId: SCHOOL_ID,
        name: dudi.name,
        sectorCategory: dudi.sectorCategory,
        address: dudi.address,
        city: dudi.city,
        latitude: dudi.latitude,
        longitude: dudi.longitude,
        maxQuota: dudi.maxQuota,
      },
      update: {
        name: dudi.name,
        maxQuota: dudi.maxQuota,
      },
    });

    await prisma.dudiMentor.upsert({
      where: { id: dudi.mentorId },
      create: {
        id: dudi.mentorId,
        dudiPartnerId: dudi.id,
        fullName: dudi.mentorName,
        jobTitle: dudi.mentorJobTitle,
        whatsappNumber: dudi.mentorWhatsapp,
        // PIN dan deviceToken akan di-setup saat onboarding nyata
      },
      update: {
        fullName: dudi.mentorName,
      },
    });

    console.log(`   ✅ ${dudi.name} — mentor: ${dudi.mentorName}`);
  }
  console.log();

  // 8. Upsert Placements (5 siswa → 5 DUDI pertama, siswa 1 & 2 ke DUDI sama untuk TC-009 rotasi)
  console.log("📋 Menyimpan penempatan siswa...");

  const placements = [
    {
      studentId: STUDENT_IDS[0],
      dudiId: DUDI_IDS[0],
      mentorId: MENTOR_IDS[0],
      compatibilityScore: 88.5,
      distanceKm: 3.2,
    },
    {
      studentId: STUDENT_IDS[1],
      dudiId: DUDI_IDS[1],
      mentorId: MENTOR_IDS[1],
      compatibilityScore: 79.0,
      distanceKm: 1.8,
    },
    {
      studentId: STUDENT_IDS[2],
      dudiId: DUDI_IDS[1],
      mentorId: MENTOR_IDS[1],
      compatibilityScore: 75.5,
      distanceKm: 2.1,
    },
    {
      studentId: STUDENT_IDS[3],
      dudiId: DUDI_IDS[2],
      mentorId: MENTOR_IDS[2],
      compatibilityScore: 82.0,
      distanceKm: 4.5,
    },
    {
      studentId: STUDENT_IDS[4],
      dudiId: DUDI_IDS[3],
      mentorId: MENTOR_IDS[3],
      compatibilityScore: 90.0,
      distanceKm: 5.7,
    },
  ];

  for (const p of placements) {
    const placementId = deterministicUuid(
      `placement-${p.studentId}-${p.dudiId}`
    );

    await prisma.placement.upsert({
      where: { id: placementId },
      create: {
        id: placementId,
        academicPeriodId: PERIOD_ID,
        studentId: p.studentId,
        teacherId: TEACHER_ID,
        dudiPartnerId: p.dudiId,
        dudiMentorId: p.mentorId,
        compatibilityScore: p.compatibilityScore,
        coverageScore: 0,
        distanceKm: p.distanceKm,
        status: PlacementStatus.ACTIVE,
      },
      update: {
        status: PlacementStatus.ACTIVE,
      },
    });
  }

  console.log(`   ✅ ${placements.length} penempatan aktif disimpan\n`);

  // ─── Ringkasan ─────────────────────────────────────────────────────────────
  console.log("─".repeat(50));
  console.log("✅ Seeder v1 selesai!\n");
  console.log("Ringkasan data demo:");
  console.log(`  🏫 Sekolah   : ${DEMO_SCHOOL.name}`);
  console.log(`  📅 Periode   : ${DEMO_PERIOD.name}`);
  console.log(`  🗂️ Jurusan   : 6 (AKL, RPL, DKV, Kuliner, Farmasi, Otomotif)`);
  console.log(`  👨‍🏫 Guru      : 1 (${DEMO_TEACHER.fullName})`);
  console.log(`  👨‍🎓 Siswa     : ${DEMO_STUDENTS.length}`);
  console.log(`  🏢 DUDI      : ${DEMO_DUDIS.length}`);
  console.log(`  📋 Penempatan: ${placements.length} aktif`);
  console.log("─".repeat(50));
}

main()
  .catch((err) => {
    console.error("❌ Seeder gagal:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * seed-v2.ts — VokaLink Production Seeder (3 SMK, 36 Guru, 300 Siswa, 18 DUDI, Multi-Tenant)
 *
 * Sesuai Permintaan Spesifik:
 * 1. Tiga Sekolah Saja:
 *    - SMK Telkom 1 Medan (Sumatera Utara, Medan)
 *    - SMK Negeri 1 Bandung (Jawa Barat, Bandung)
 *    - SMK Negeri 26 Jakarta (DKI Jakarta, Jakarta Timur)
 * 2. 12 Guru per sekolah (total 36 guru)
 * 3. 100 Siswa per sekolah (total 300 siswa)
 * 4. 18 Mitra DUDI & Mentor Industri terikat
 * 5. Riwayat penempatan, logbook harian, kasus drift alert, dan paspor kompetensi.
 *
 * Jalankan: pnpm --filter api seed:v2
 */

import {
  PrismaClient,
  UserRole,
  LogStatus,
  AttendanceType,
  NonCompetencyCategory,
  DriftAlertType,
  DriftAlertSeverity,
  DriftAlertStatus,
  PlacementStatus,
} from "@prisma/client";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";
import {
  sealObjectWithHmac,
  hashPinWithScrypt,
  hashSha256Hex,
  generateSalt,
} from "@vokalink/core/crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

const prisma = new PrismaClient();

const SERVER_CRYPTO_SECRET =
  process.env.SERVER_CRYPTO_SECRET ||
  "44cf2ed7fbbf25c00cd72449cda689a90ef8b63b61cfa52c7baca6976b1bd4e7";
const PIN_PEPPER =
  process.env.PIN_PEPPER ||
  "2368e2efd2c3f72399a155b368dfaa0377122fc6d41afd66c2215d717f8543f4";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deterministicUuid(seed: string): string {
  const hash = createHash("sha256").update(seed).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    ((parseInt(hash[16], 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}

// ─── Load Curriculum Seed ─────────────────────────────────────────────────────

const seedFilePath = join(__dirname, "curriculum-seed.json");
const curriculumData = JSON.parse(readFileSync(seedFilePath, "utf-8"));

// ─── Data 3 Sekolah Resmi ─────────────────────────────────────────────────────

const SCHOOLS_DATA = [
  {
    code: "MEDAN",
    id: deterministicUuid("school-smk-telkom-1-medan"),
    npsn: "10210852",
    name: "SMK Telkom 1 Medan",
    province: "Sumatera Utara",
    city: "Medan",
    latitude: 3.5852,
    longitude: 98.6756,
    emailDomain: "smktelkom1medan.sch.id",
    adminEmail: "adminpkl@smktelkom1medan.sch.id",
    adminName: "Drs. H. Mulyadi, M.Kom (Pokja PKL)",
  },
  {
    code: "BANDUNG",
    id: deterministicUuid("school-smk-negeri-1-bandung"),
    npsn: "20219141",
    name: "SMK Negeri 1 Bandung",
    province: "Jawa Barat",
    city: "Bandung",
    latitude: -6.9175,
    longitude: 107.6191,
    emailDomain: "smkn1bandung.sch.id",
    adminEmail: "adminpkl@smkn1bandung.sch.id",
    adminName: "Dr. Hj. Nina Herlina, M.Pd (Pokja PKL)",
  },
  {
    code: "JAKARTA",
    id: deterministicUuid("school-smk-negeri-26-jakarta"),
    npsn: "20102572",
    name: "SMK Negeri 26 Jakarta",
    province: "DKI Jakarta",
    city: "Jakarta Timur",
    latitude: -6.2088,
    longitude: 106.8824,
    emailDomain: "smkn26jkt.sch.id",
    adminEmail: "adminpkl@smkn26jkt.sch.id",
    adminName: "Ir. Bambang Widyatmoko, M.T (Pokja PKL)",
  },
];

const usedEmailsSet = new Set<string>();

function generateUniqueEmail(rawName: string, domain: string): string {
  const cleanName = rawName
    .replace(/(drs\.|dr\.|hj\.|h\.|ir\.)/gi, "")
    .replace(/\(.*?\)/g, "")
    .split(",")[0]!
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  let candidate = `${cleanName}@${domain}`;
  let counter = 2;
  while (usedEmailsSet.has(candidate)) {
    candidate = `${cleanName}${counter}@${domain}`;
    counter++;
  }
  usedEmailsSet.add(candidate);
  return candidate;
}

// ─── Generator Nama Indonesia ─────────────────────────────────────────────────

const FIRST_NAMES = [
  "Andi", "Budi", "Citra", "Dewi", "Eko", "Fajar", "Gita", "Hadi", "Indra", "Joko",
  "Kurnia", "Lestari", "Mega", "Nugroho", "Octavia", "Pratama", "Qori", "Rizky", "Siti",
  "Taufik", "Utami", "Vina", "Wahyu", "Yoga", "Zulfa", "Aditya", "Bayu", "Cahyo",
  "Dian", "Eka", "Farhan", "Gilang", "Hafiz", "Ilham", "Jihan", "Kusuma", "Lutfi",
  "Mahendra", "Nadya", "Putra", "Putri", "Raden", "Satria", "Tri", "Vicky", "Wulan",
];

const LAST_NAMES = [
  "Pratama", "Santoso", "Maharani", "Anggraini", "Saputra", "Ramadhan", "Wibowo",
  "Hidayat", "Kusuma", "Setiawan", "Utomo", "Permata", "Wijaya", "Siregar", "Nasution",
  "Harahap", "Lubis", "Pohan", "Sitorus", "Ginting", "Tarigan", "Sembiring", "Pasaribu",
  "Sanjaya", "Suryono", "Handoko", "Kurniawan", "Kuswanto", "Nugraha", "Firmansyah",
];

function generateIndonesianName(index: number): string {
  const f = FIRST_NAMES[index % FIRST_NAMES.length];
  const l = LAST_NAMES[(index * 7 + 3) % LAST_NAMES.length];
  return `${f} ${l}`;
}

// ─── Data Mitra DUDI & Mentor Industri ────────────────────────────────────────

const DUDI_DATA = [
  // Medan
  {
    id: deterministicUuid("dudi-medan-1"),
    city: "Medan",
    name: "PT Telkom Indonesia Witel Sumut",
    sectorCategory: "Teknologi Informasi dan Komunikasi",
    address: "Jl. Putri Hijau No. 1, Kesawan, Medan Barat",
    latitude: 3.5962,
    longitude: 98.6772,
    maxQuota: 15,
    qualityScore: 4.85,
    mentorName: "Rahmat Hidayat Siregar, S.T",
    mentorJob: "Network & Cloud Engineering Lead",
    mentorWa: "6281260001001",
  },
  {
    id: deterministicUuid("dudi-medan-2"),
    city: "Medan",
    name: "PT Prima Solusindo Teknologi",
    sectorCategory: "Rekayasa Perangkat Lunak",
    address: "Komp. Multatuli Indah Blok D-12, Medan",
    latitude: 3.5781,
    longitude: 98.6834,
    maxQuota: 10,
    qualityScore: 4.75,
    mentorName: "Ferry Anggriawan, M.Cs",
    mentorJob: "Senior Fullstack Developer",
    mentorWa: "6281260001002",
  },
  {
    id: deterministicUuid("dudi-medan-3"),
    city: "Medan",
    name: "Studio Visual Kreatif Medan",
    sectorCategory: "Desain Komunikasi Visual & Multimedia",
    address: "Jl. Setiabudi No. 88, Medan Selayang",
    latitude: 3.5512,
    longitude: 98.6321,
    maxQuota: 8,
    qualityScore: 4.6,
    mentorName: "Annisa Lubis, S.Ds",
    mentorJob: "Creative Director",
    mentorWa: "6281260001003",
  },
  {
    id: deterministicUuid("dudi-medan-4"),
    city: "Medan",
    name: "KAP Syahril & Rekan",
    sectorCategory: "Akuntansi dan Keuangan Lembaga",
    address: "Jl. Balai Kota No. 15, Medan Petisah",
    latitude: 3.5912,
    longitude: 98.6741,
    maxQuota: 8,
    qualityScore: 4.65,
    mentorName: "T. M. Zulkarnain, S.E., Ak., CA",
    mentorJob: "Senior Audit Supervisor",
    mentorWa: "6281260001004",
  },
  {
    id: deterministicUuid("dudi-medan-5"),
    city: "Medan",
    name: "Hotel Grand Mercure Medan Angkasa",
    sectorCategory: "Pariwisata dan Perhotelan (Kuliner)",
    address: "Jl. Sutomo No. 1, Medan Timur",
    latitude: 3.5978,
    longitude: 98.6881,
    maxQuota: 10,
    qualityScore: 4.8,
    mentorName: "Chef Zulkifli Nasution",
    mentorJob: "Executive Chef",
    mentorWa: "6281260001005",
  },
  {
    id: deterministicUuid("dudi-medan-6"),
    city: "Medan",
    name: "Auto2000 Medan Amplas",
    sectorCategory: "Teknik Otomotif Kendaraan Ringan",
    address: "Jl. Sisingamangaraja KM 9.8, Medan Amplas",
    latitude: 3.5245,
    longitude: 98.7102,
    maxQuota: 10,
    qualityScore: 4.7,
    mentorName: "Irwansyah Putra",
    mentorJob: "Kepala Bengkel & Service Advisor",
    mentorWa: "6281260001006",
  },

  // Bandung
  {
    id: deterministicUuid("dudi-bdg-1"),
    city: "Bandung",
    name: "PT LEN Industri (Persero)",
    sectorCategory: "Elektronika dan Sistem Komunikasi",
    address: "Jl. Soekarno-Hatta No. 442, Bandung",
    latitude: -6.9531,
    longitude: 107.6189,
    maxQuota: 12,
    qualityScore: 4.9,
    mentorName: "Ir. Dedi Supriyadi, M.T",
    mentorJob: "Head of Systems Integration",
    mentorWa: "6281220002001",
  },
  {
    id: deterministicUuid("dudi-bdg-2"),
    city: "Bandung",
    name: "PT Gamatechno Bandung Creative Hub",
    sectorCategory: "Rekayasa Perangkat Lunak",
    address: "Jl. Dago Asri No. 10, Coblong, Bandung",
    latitude: -6.8791,
    longitude: 107.6174,
    maxQuota: 10,
    qualityScore: 4.8,
    mentorName: "Asep Sunandar, S.Kom",
    mentorJob: "Lead Software Architect",
    mentorWa: "6281220002002",
  },
  {
    id: deterministicUuid("dudi-bdg-3"),
    city: "Bandung",
    name: "Agate Visual Studio & Animation",
    sectorCategory: "Desain Komunikasi Visual & Animasi",
    address: "Jl. Sumur Bandung No. 18, Bandung",
    latitude: -6.9123,
    longitude: 107.6145,
    maxQuota: 8,
    qualityScore: 4.75,
    mentorName: "Rina Kusuma Dewi, S.Sn",
    mentorJob: "Art Lead & Character Designer",
    mentorWa: "6281220002003",
  },
  {
    id: deterministicUuid("dudi-bdg-4"),
    city: "Bandung",
    name: "KAP Sugiharto & Rekan Bandung",
    sectorCategory: "Akuntansi dan Keuangan Lembaga",
    address: "Jl. Asia Afrika No. 120, Bandung",
    latitude: -6.9214,
    longitude: 107.6089,
    maxQuota: 8,
    qualityScore: 4.6,
    mentorName: "Dra. Euis Rohaeti, Ak., MM",
    mentorJob: "Senior Tax Consultant",
    mentorWa: "6281220002004",
  },
  {
    id: deterministicUuid("dudi-bdg-5"),
    city: "Bandung",
    name: "The Papandayan Hotel & Resto",
    sectorCategory: "Kuliner & Tata Boga",
    address: "Jl. Gatot Subroto No. 83, Malabar, Bandung",
    latitude: -6.9281,
    longitude: 107.6251,
    maxQuota: 10,
    qualityScore: 4.85,
    mentorName: "Chef Tatang Sutisna",
    mentorJob: "Pastry & Bakery Specialist",
    mentorWa: "6281220002005",
  },
  {
    id: deterministicUuid("dudi-bdg-6"),
    city: "Bandung",
    name: "Bengkel Resmi Astra Daihatsu Bandung",
    sectorCategory: "Teknik Otomotif Kendaraan Ringan",
    address: "Jl. Cibeureum No. 42, Bandung",
    latitude: -6.9089,
    longitude: 107.5712,
    maxQuota: 10,
    qualityScore: 4.7,
    mentorName: "Gunawan Wibisono",
    mentorJob: "Master Workshop Technician",
    mentorWa: "6281220002006",
  },

  // Jakarta
  {
    id: deterministicUuid("dudi-jkt-1"),
    city: "Jakarta Timur",
    name: "PT Astra International Tbk",
    sectorCategory: "Teknologi Industri & Manufaktur",
    address: "Jl. Gaya Motor Raya No. 8, Sunter II, Jakarta",
    latitude: -6.1412,
    longitude: 106.8856,
    maxQuota: 15,
    qualityScore: 4.95,
    mentorName: "Bambang Waskito, S.T., M.M",
    mentorJob: "General Workshop & Technical Manager",
    mentorWa: "6281310003001",
  },
  {
    id: deterministicUuid("dudi-jkt-2"),
    city: "Jakarta Timur",
    name: "PT Telkom Data Ekosistem (NeutraDC)",
    sectorCategory: "Teknologi Informasi dan Jaringan",
    address: "Kawasan Industri Pulo Gadung, Jakarta Timur",
    latitude: -6.1956,
    longitude: 106.9123,
    maxQuota: 12,
    qualityScore: 4.9,
    mentorName: "Rizky Firmansyah, S.Kom",
    mentorJob: "Data Center Infrastructure Lead",
    mentorWa: "6281310003002",
  },
  {
    id: deterministicUuid("dudi-jkt-3"),
    city: "Jakarta Timur",
    name: "Nusantara Digital Software Labs",
    sectorCategory: "Rekayasa Perangkat Lunak",
    address: "Cyber 2 Tower Lt. 18, Jl. HR Rasuna Said, Jakarta",
    latitude: -6.2245,
    longitude: 106.8312,
    maxQuota: 10,
    qualityScore: 4.85,
    mentorName: "Hendrik Gunawan, M.T.I",
    mentorJob: "Principal Software Engineer",
    mentorWa: "6281310003003",
  },
  {
    id: deterministicUuid("dudi-jkt-4"),
    city: "Jakarta Timur",
    name: "Creative Motion Digital Agency",
    sectorCategory: "Desain Komunikasi Visual & Periklanan",
    address: "Jl. Pemuda No. 65, Rawamangun, Jakarta Timur",
    latitude: -6.1945,
    longitude: 106.8891,
    maxQuota: 8,
    qualityScore: 4.75,
    mentorName: "Jessica Amanda, B.Des",
    mentorJob: "Head of Digital Brand Design",
    mentorWa: "6281310003004",
  },
  {
    id: deterministicUuid("dudi-jkt-5"),
    city: "Jakarta Timur",
    name: "KAP Tanubrata Sutanto Fahmi Bambang (BDO)",
    sectorCategory: "Akuntansi dan Keuangan Lembaga",
    address: "Prudential Tower Lt. 17, Jl. Jend Sudirman, Jakarta",
    latitude: -6.2089,
    longitude: 106.8214,
    maxQuota: 10,
    qualityScore: 4.85,
    mentorName: "Hendra Wijaya, S.E., CPA",
    mentorJob: "Audit & Assurance Partner",
    mentorWa: "6281310003005",
  },
  {
    id: deterministicUuid("dudi-jkt-6"),
    city: "Jakarta Timur",
    name: "The Ritz-Carlton Jakarta Culinary Team",
    sectorCategory: "Pariwisata & Kuliner Internasional",
    address: "Mega Kuningan Barat No. 1, Jakarta",
    latitude: -6.2291,
    longitude: 106.8278,
    maxQuota: 10,
    qualityScore: 4.9,
    mentorName: "Chef Marco Bastian",
    mentorJob: "Executive Sous Chef",
    mentorWa: "6281310003006",
  },
];

// ─── Work Dates Generator ─────────────────────────────────────────────────────

function generateWorkDates(): Date[] {
  const dates: Date[] = [];
  const curr = new Date("2026-01-05T08:00:00.000Z");
  while (dates.length < 25) {
    const day = curr.getUTCDay();
    if (day >= 1 && day <= 5) {
      dates.push(new Date(curr));
    }
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return dates;
}

// ─── Main Seeder Function ─────────────────────────────────────────────────────

export async function seedV2(): Promise<void> {
  console.log("=================================================================");
  console.log("🚀 VokaLink Production Seeder v2: 3 SMK, 36 Guru, 300 Siswa Riil");
  console.log("=================================================================\n");

  // 1. Bersihkan Data Lama Secara Bertahap dan Aman
  console.log("🧹 Membersihkan database lama...");
  await prisma.$transaction([
    prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`),
    prisma.$executeRawUnsafe(`DELETE FROM daily_log_items;`),
    prisma.$executeRawUnsafe(`DELETE FROM daily_logs;`),
    prisma.$executeRawUnsafe(`DELETE FROM drift_alerts;`),
    prisma.$executeRawUnsafe(`DELETE FROM intervention_logs;`),
    prisma.$executeRawUnsafe(`DELETE FROM endorsements;`),
    prisma.$executeRawUnsafe(`DELETE FROM skill_passports;`),
    prisma.$executeRawUnsafe(`DELETE FROM placements;`),
    prisma.$executeRawUnsafe(`DELETE FROM security_flags;`),
    prisma.$executeRawUnsafe(`DELETE FROM signed_links;`),
    prisma.$executeRawUnsafe(`DELETE FROM user_profiles;`),
    prisma.$executeRawUnsafe(`DELETE FROM dudi_capabilities;`),
    prisma.$executeRawUnsafe(`DELETE FROM dudi_mentors;`),
    prisma.$executeRawUnsafe(`DELETE FROM dudi_partners;`),
    prisma.$executeRawUnsafe(`DELETE FROM job_cards;`),
    prisma.$executeRawUnsafe(`DELETE FROM cp_elements;`),
    prisma.$executeRawUnsafe(`DELETE FROM school_departments;`),
    prisma.$executeRawUnsafe(`DELETE FROM academic_periods;`),
    prisma.$executeRawUnsafe(`DELETE FROM schools;`),
    prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`),
  ]);
  console.log("   ✅ Database bersih dan siap diisi.\n");

  // 2. Master Departments
  console.log("📚 Menyimpan Master Departments...");
  for (const dept of curriculumData.masterDepartments) {
    const id = deterministicUuid(`master-dept-${dept.sectorCode}`);
    await prisma.masterDepartment.upsert({
      where: { sectorCode: dept.sectorCode },
      create: {
        id,
        sectorCode: dept.sectorCode,
        name: dept.name,
        description: dept.description,
      },
      update: { name: dept.name, description: dept.description },
    });
  }
  console.log(`   ✅ ${curriculumData.masterDepartments.length} Master Departments tersimpan.\n`);

  // 3. Simpan DUDI Partners & Mentors
  console.log("🏢 Menyimpan 18+ Mitra DUDI & Mentor Industri...");
  const salt = generateSalt();
  const defaultPinHash = hashPinWithScrypt("1234", salt, PIN_PEPPER);

  for (let i = 0; i < DUDI_DATA.length; i++) {
    const d = DUDI_DATA[i];
    const mentorId = deterministicUuid(`mentor-${d.id}`);

    await prisma.dudiPartner.create({
      data: {
        id: d.id,
        name: d.name,
        sectorCategory: d.sectorCategory,
        address: d.address,
        city: d.city,
        latitude: d.latitude,
        longitude: d.longitude,
        maxQuota: d.maxQuota,
        qualityIndexScore: d.qualityScore,
        mentors: {
          create: {
            id: mentorId,
            fullName: d.mentorName,
            jobTitle: d.mentorJob,
            whatsappNumber: d.mentorWa,
            pinHash: defaultPinHash,
            pinSalt: salt,
            deviceTokenHash: hashSha256Hex(`device-token-mentor-${i}`),
            tokenBoundAt: new Date("2026-01-05T08:00:00.000Z"),
          },
        },
      },
    });
  }
  console.log(`   ✅ ${DUDI_DATA.length} DUDI Partners dan Mentor tersimpan.\n`);

  // 4. Loop untuk Masing-Masing dari 3 Sekolah Resmi
  const workDates = generateWorkDates();
  let globalStudentCount = 0;
  let globalTeacherCount = 0;

  for (let sIdx = 0; sIdx < SCHOOLS_DATA.length; sIdx++) {
    const schoolInfo = SCHOOLS_DATA[sIdx];
    console.log(`🏫 [${sIdx + 1}/3] Mengisi data untuk: ${schoolInfo.name} (${schoolInfo.city})...`);

    // 4.1 Buat Sekolah
    await prisma.school.create({
      data: {
        id: schoolInfo.id,
        npsn: schoolInfo.npsn,
        name: schoolInfo.name,
        province: schoolInfo.province,
        city: schoolInfo.city,
        latitude: schoolInfo.latitude,
        longitude: schoolInfo.longitude,
        isDemoSandbox: false,
      },
    });

    // 4.2 Buat Periode Akademik
    const periodId = deterministicUuid(`period-${schoolInfo.id}`);
    await prisma.academicPeriod.create({
      data: {
        id: periodId,
        schoolId: schoolInfo.id,
        name: "PKL Semester Genap 2025/2026",
        startDate: new Date("2026-01-05"),
        endDate: new Date("2026-06-27"),
        targetTotalJp: 792,
        isActive: true,
      },
    });

    // 4.3 Buat Admin Pokja PKL
    const adminId = deterministicUuid(`admin-${schoolInfo.id}`);
    await prisma.userProfile.create({
      data: {
        id: adminId,
        schoolId: schoolInfo.id,
        role: UserRole.SCHOOL_ADMIN,
        email: schoolInfo.adminEmail,
        fullName: schoolInfo.adminName,
        identityNumber: schoolInfo.npsn,
        whatsappNumber: `62811000${sIdx + 1}001`,
      },
    });

    // Khusus sekolah pertama (SMK Telkom 1 Medan), buat juga akun admin standar admin.smk@vokalink.id
    if (sIdx === 0) {
      const genericAdminId = deterministicUuid("vokalink-demo-school-v1");
      await prisma.userProfile.create({
        data: {
          id: genericAdminId,
          schoolId: schoolInfo.id,
          role: UserRole.SCHOOL_ADMIN,
          email: "admin@smktelkom1medan.sch.id",
          fullName: "Admin Pokja PKL (SMK Telkom 1 Medan)",
          identityNumber: "99000001",
          whatsappNumber: "6281199000001",
        },
      });
    }

    // 4.4 Kloning 6 Jurusan / Departemen + CP Elements + Job Cards
    const deptMap: { [code: string]: { id: string; cpElements: any[] } } = {};

    for (const dCurr of curriculumData.curriculum) {
      const deptId = deterministicUuid(`dept-${schoolInfo.id}-${dCurr.sectorCode}`);
      const mDeptId = deterministicUuid(`master-dept-${dCurr.sectorCode}`);

      const sDept = await prisma.schoolDepartment.create({
        data: {
          id: deptId,
          schoolId: schoolInfo.id,
          masterDepartmentId: mDeptId,
          sectorCode: dCurr.sectorCode,
          name: dCurr._jurusan.split(" — ")[1]?.split(" (")[0] || dCurr.sectorCode,
          isLocked: false,
        },
      });

      const loadedCps: any[] = [];
      for (const cp of dCurr.cpElements) {
        const cpId = deterministicUuid(`cp-${deptId}-${cp.code}`);
        const createdCp = await prisma.cpElement.create({
          data: {
            id: cpId,
            schoolDepartmentId: deptId,
            code: cp.code,
            title: cp.title,
            targetJp: cp.targetJp,
            sortOrder: cp.sortOrder,
          },
        });

        const loadedJcs: any[] = [];
        for (const jc of cp.jobCards) {
          const jcId = deterministicUuid(`jc-${cpId}-${jc.title.slice(0, 30)}`);
          const createdJc = await prisma.jobCard.create({
            data: {
              id: jcId,
              schoolDepartmentId: deptId,
              cpElementId: cpId,
              title: jc.title.slice(0, 60),
              skkniUnitCode: jc.skkniUnitCode,
              toolsAndSoftware: jc.toolsAndSoftware,
              actionVerbTemplate: jc.actionVerbTemplate,
              isNonCompetency: false,
            },
          });
          loadedJcs.push(createdJc);
        }
        loadedCps.push({ ...createdCp, jobCards: loadedJcs });
      }

      // Non-competency job cards
      for (const nc of dCurr.nonCompetencyJobCards || []) {
        const ncId = deterministicUuid(`nc-jc-${deptId}-${nc.title.slice(0, 30)}`);
        await prisma.jobCard.create({
          data: {
            id: ncId,
            schoolDepartmentId: deptId,
            cpElementId: null,
            title: nc.title.slice(0, 60),
            toolsAndSoftware: nc.toolsAndSoftware || [],
            actionVerbTemplate: nc.actionVerbTemplate,
            isNonCompetency: true,
          },
        });
      }

      deptMap[dCurr.sectorCode] = { id: deptId, cpElements: loadedCps };
    }

    // 4.5 Buat 12 Guru Pembimbing (2 guru per jurusan)
    const deptCodes = Object.keys(deptMap);
    const teacherProfiles: any[] = [];

    for (let t = 0; t < 12; t++) {
      globalTeacherCount++;
      const assignedDeptCode = deptCodes[t % deptCodes.length];
      const assignedDept = deptMap[assignedDeptCode];
      const teacherId = deterministicUuid(`teacher-${schoolInfo.id}-${t}`);
      const nip = `198${(t % 8) + 1}0115200${(t % 9) + 1}0110${t < 10 ? "0" + t : t}`;

      // Sisipkan Budi Santoso sebagai guru pertama di SMK Telkom 1 Medan
      const teacherName =
        sIdx === 0 && t === 0
          ? "Budi Santoso, S.Kom"
          : `${generateIndonesianName(globalTeacherCount * 3 + 1)}, S.Pd., M.Kom`;

      const teacherEmail =
        sIdx === 0 && t === 0
          ? "budisantoso@smktelkom1medan.sch.id"
          : generateUniqueEmail(teacherName, schoolInfo.emailDomain);

      const tProfile = await prisma.userProfile.create({
        data: {
          id: teacherId,
          schoolId: schoolInfo.id,
          schoolDepartmentId: assignedDept.id,
          role: UserRole.TEACHER,
          email: teacherEmail,
          fullName: teacherName,
          identityNumber: sIdx === 0 && t === 0 ? "197501012000011001" : nip,
          whatsappNumber: `628123456${1000 + globalTeacherCount}`,
        },
      });
      teacherProfiles.push(tProfile);
    }
    console.log(`   ✅ 12 Guru Pembimbing dibuat untuk ${schoolInfo.name}.`);

    // 4.6 Buat Tepat 100 Siswa untuk Sekolah Ini Secara Cepat (createMany Batch)
    console.log(`   👨‍🎓 Menyimpan batch 100 Siswa untuk ${schoolInfo.name}...`);
    const schoolDudis = DUDI_DATA.filter((d) => d.city.toLowerCase().includes(schoolInfo.city.toLowerCase()));
    const effectiveDudis = schoolDudis.length > 0 ? schoolDudis : DUDI_DATA;

    const studentsToBatch: any[] = [];
    const placementsToBatch: any[] = [];
    const studentIdsList: string[] = [];
    const studentDeptMap: { [sid: string]: any } = {};

    for (let s = 0; s < 100; s++) {
      globalStudentCount++;
      const studentId = deterministicUuid(`student-${schoolInfo.id}-${s}`);
      studentIdsList.push(studentId);

      const deptCode = deptCodes[s % deptCodes.length];
      const assignedDept = deptMap[deptCode];
      studentDeptMap[studentId] = assignedDept;

      const assignedTeacher = teacherProfiles[s % teacherProfiles.length];

      // Format NISN 10 Digit
      const nisnPrefix = sIdx === 0 ? "0078901" : sIdx === 1 ? "0078902" : "0078903";
      const nisnSuffix = String(s + 1).padStart(3, "0");
      let nisn = `${nisnPrefix}${nisnSuffix}`;

      // Akun demo khusus di SMK Telkom 1 Medan
      let studentName = generateIndonesianName(globalStudentCount);
      let studentEmail = "";

      if (sIdx === 0 && s === 0) {
        nisn = "0078901234";
        studentName = "Andi Pratama";
        studentEmail = "andipratama@smktelkom1medan.sch.id";
      } else if (sIdx === 0 && s === 1) {
        nisn = "0078901235";
        studentName = "Bintang Ramadhan";
        studentEmail = "bintangramadhan@smktelkom1medan.sch.id";
      } else if (sIdx === 0 && s === 2) {
        nisn = "0078901236";
        studentName = "Citra Maharani";
        studentEmail = "citramaharani@smktelkom1medan.sch.id";
      } else if (sIdx === 0 && s === 3) {
        nisn = "0078901237";
        studentName = "Dewi Anggraini";
        studentEmail = "dewianggraini@smktelkom1medan.sch.id";
      } else {
        studentEmail = generateUniqueEmail(studentName, schoolInfo.emailDomain);
      }

      const latOffset = ((s % 10) - 5) * 0.005;
      const lngOffset = (((s * 3) % 10) - 5) * 0.005;

      studentsToBatch.push({
        id: studentId,
        schoolId: schoolInfo.id,
        schoolDepartmentId: assignedDept.id,
        role: UserRole.STUDENT,
        email: studentEmail,
        fullName: studentName,
        identityNumber: nisn,
        whatsappNumber: `628129876${String(globalStudentCount).padStart(4, "0")}`,
        homeLatitude: Number((schoolInfo.latitude + latOffset).toFixed(6)),
        homeLongitude: Number((schoolInfo.longitude + lngOffset).toFixed(6)),
      });

      const dudi = effectiveDudis[s % effectiveDudis.length];
      const mentorId = deterministicUuid(`mentor-${dudi.id}`);
      const placementId = deterministicUuid(`placement-${studentId}`);

      placementsToBatch.push({
        id: placementId,
        studentId: studentId,
        academicPeriodId: periodId,
        dudiPartnerId: dudi.id,
        dudiMentorId: mentorId,
        teacherId: assignedTeacher.id,
        status: PlacementStatus.ACTIVE,
        compatibilityScore: 88.5,
        coverageScore: 92.0,
        distanceKm: Number((1.5 + (s % 7) * 0.8).toFixed(2)),
        requiresMidtermRotation: false,
        rotationSequence: 1,
      });
    }

    // Simpan 100 Siswa dan 100 Placement dalam satu roundtrip
    await prisma.userProfile.createMany({ data: studentsToBatch });
    await prisma.placement.createMany({ data: placementsToBatch });
    console.log(`   ✅ 100 Siswa & Penempatan tersimpan di database.`);

    // 4.7 Buat Log Harian untuk 4 Siswa Utama di Masing-Masing Sekolah
    console.log(`   📝 Mengisi riwayat logbook dan aktivitas siswa utama...`);
    for (let s = 0; s < 4; s++) {
      const studentId = studentIdsList[s];
      const assignedDept = studentDeptMap[studentId];
      const cpElementList = assignedDept.cpElements;
      const dudi = effectiveDudis[s % effectiveDudis.length];
      const mentorId = deterministicUuid(`mentor-${dudi.id}`);
      const placementId = deterministicUuid(`placement-${studentId}`);

      if (cpElementList && cpElementList.length > 0) {
        let verifiedCount = 0;
        const logLimit = sIdx === 0 && s === 0 ? 16 : 8;

        for (let dayIdx = 0; dayIdx < Math.min(logLimit, workDates.length); dayIdx++) {
          const logDate = workDates[dayIdx];
          const logId = deterministicUuid(`log-${studentId}-${dayIdx}`);
          const cp = cpElementList[dayIdx % cpElementList.length];
          const jc = cp.jobCards && cp.jobCards.length > 0 ? cp.jobCards[0] : null;

          if (jc) {
            const isVerified = dayIdx < logLimit - 1;
            const durationJp = 8;
            if (isVerified) verifiedCount += durationJp;

            const logSeal = isVerified
              ? sealObjectWithHmac(SERVER_CRYPTO_SECRET, {
                  logId,
                  studentId,
                  logDate: logDate.toISOString().slice(0, 10),
                  status: LogStatus.VERIFIED,
                  mentorId,
                })
              : null;

            // Buat daily log dalam status PENDING_VERIFICATION (sesuai trigger DB)
            await prisma.dailyLog.create({
              data: {
                id: logId,
                clientLogUuid: deterministicUuid(`client-uuid-${logId}`),
                placementId: placementId,
                studentId: studentId,
                logDate: logDate,
                attendanceType: AttendanceType.PRESENT,
                status: LogStatus.PENDING_VERIFICATION,
                shortNote: `Penerapan ${jc.title} sesuai standar industri.`,
                items: {
                  create: {
                    id: deterministicUuid(`item-${logId}`),
                    jobCardId: jc.id,
                    durationJp: durationJp,
                    autonomyLevel: 2,
                  },
                },
              },
            });

            // Jika terverifikasi, update status menjadi VERIFIED
            if (isVerified) {
              await prisma.dailyLog.update({
                where: { id: logId },
                data: {
                  status: LogStatus.VERIFIED,
                  verifiedAt: new Date(logDate.getTime() + 10 * 3600 * 1000),
                  verifiedByMentorId: mentorId,
                  signatureHash: logSeal,
                },
              });
            }
          }
        }

        // Sisipkan Kasus Drift untuk Siswa SMK Telkom 1 Medan
        if (sIdx === 0 && s === 1) {
          await prisma.driftAlert.create({
            data: {
              id: deterministicUuid(`drift-alert-${placementId}`),
              placementId: placementId,
              studentId: studentId,
              alertType: DriftAlertType.NON_COMPETENCY_OVERLOAD,
              severity: DriftAlertSeverity.CRITICAL,
              status: DriftAlertStatus.OPEN,
              metricSnapshotJson: {
                nonCompetencyRatio: 0.42,
                dominantCategory: NonCompetencyCategory.ADMIN_UMUM,
                detectedReason: "Rasio penugasan non-kompetensi 42% (melebihi ambang batas 30%).",
              },
            },
          });
        } else if (sIdx === 0 && s === 2) {
          await prisma.driftAlert.create({
            data: {
              id: deterministicUuid(`drift-alert-${placementId}`),
              placementId: placementId,
              studentId: studentId,
              alertType: DriftAlertType.SKILL_MONOTONY,
              severity: DriftAlertSeverity.WARNING,
              status: DriftAlertStatus.OPEN,
              metricSnapshotJson: {
                dominantPercentage: 0.82,
                detectedReason: "82% jam praktik terkonsentrasi di 1 elemen kompetensi saja.",
              },
            },
          });
        } else if (sIdx === 0 && s === 3) {
          await prisma.driftAlert.create({
            data: {
              id: deterministicUuid(`drift-alert-${placementId}`),
              placementId: placementId,
              studentId: studentId,
              alertType: DriftAlertType.APPROVAL_DORMANCY,
              severity: DriftAlertSeverity.INFO,
              status: DriftAlertStatus.OPEN,
              metricSnapshotJson: {
                pendingCount: 6,
                oldestPendingDays: 8,
                detectedReason: "Terdapat 6 catatan logbook pending lebih dari 7 hari belum ditinjau mentor.",
              },
            },
          });
        }

        // Paspor Kompetensi untuk Andi Pratama
        if (sIdx === 0 && s === 0) {
          await prisma.skillPassport.create({
            data: {
              id: deterministicUuid(`passport-${studentId}`),
              studentId: studentId,
              passportSlug: "andi-pratama-rpl-2026",
              summaryBio: "Siswa SMK konsentrasi Rekayasa Perangkat Lunak dengan pengalaman magang industri terverifikasi resmi di PT Telkom Indonesia Witel Sumut.",
              totalVerifiedJp: verifiedCount,
              visibilityJson: {
                isPublic: true,
                shareContact: true,
              },
            },
          });
        }
      }
    }
    console.log(`   ✅ Selesai: 100 Siswa untuk ${schoolInfo.name}.\n`);
  }

  console.log("=================================================================");
  console.log(`🎉 SEEDING SELESAI DENGAN SUKSES!`);
  console.log(`🏫 Total Sekolah: ${SCHOOLS_DATA.length}`);
  console.log(`👨‍🏫 Total Guru: ${globalTeacherCount}`);
  console.log(`👨‍🎓 Total Siswa: ${globalStudentCount} (100 Siswa / Sekolah)`);
  console.log(`🏢 Total DUDI: ${DUDI_DATA.length}`);
  console.log("=================================================================\n");
}

seedV2()
  .catch((e) => {
    console.error("❌ Seeding gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

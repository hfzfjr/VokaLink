/**
 * API client helper for VokaLink frontend
 */
import type { SchoolRegisterInput, ProblemDetails } from "@vokalink/shared";

const API_BASE_URL =
  process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:3001/api/v1";

export interface MasterDepartmentItem {
  sectorCode: string;
  name: string;
  description: string;
  totalJp: number;
  cpElementsCount: number;
  jobCardsCount: number;
}

export interface DemoSandboxData {
  school: {
    id: string;
    npsn: string;
    name: string;
    city: string;
    province: string;
    isDemoSandbox: boolean;
  };
  period: {
    id: string;
    name: string;
    targetTotalJp: number;
  } | null;
  departments: Array<{
    id: string;
    sectorCode: string;
    name: string;
    cpElementsCount: number;
    jobCardsCount: number;
  }>;
  demoAccounts: {
    schoolAdmin: {
      role: string;
      label: string;
      email: string;
      description: string;
    };
    teacher: {
      id: string;
      role: string;
      fullName: string;
      label: string;
      email: string;
      description: string;
    } | null;
    students: Array<{
      id: string;
      role: string;
      fullName: string;
      identityNumber: string;
      label: string;
      description: string;
    }>;
  };
}

export async function fetchMasterDepartments(): Promise<MasterDepartmentItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/schools/master-departments`);
    if (!res.ok) {
      throw new Error(`Gagal memuat master jurusan (${res.status})`);
    }
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error("fetchMasterDepartments error:", err);
    // Fallback static list if API server is not running
    return [
      {
        sectorCode: "AKL",
        name: "Akuntansi dan Keuangan Lembaga",
        description: "Konsentrasi keahlian bidang akuntansi, perpajakan, dan keuangan lembaga.",
        totalJp: 792,
        cpElementsCount: 5,
        jobCardsCount: 18,
      },
      {
        sectorCode: "RPL",
        name: "Rekayasa Perangkat Lunak",
        description: "Konsentrasi keahlian pemrograman, software engineering, dan database.",
        totalJp: 792,
        cpElementsCount: 4,
        jobCardsCount: 15,
      },
      {
        sectorCode: "DKV",
        name: "Desain Komunikasi Visual",
        description: "Konsentrasi keahlian ilustrasi digital, UI/UX design, dan media visual.",
        totalJp: 792,
        cpElementsCount: 4,
        jobCardsCount: 14,
      },
      {
        sectorCode: "KULINER",
        name: "Kuliner",
        description: "Konsentrasi keahlian pengolahan makanan, pastry, dan layanan restoran.",
        totalJp: 792,
        cpElementsCount: 4,
        jobCardsCount: 14,
      },
      {
        sectorCode: "FARMASI",
        name: "Farmasi Klinis dan Komunitas",
        description: "Konsentrasi keahlian pelayanan kefarmasian, peracikan obat, dan apotek.",
        totalJp: 792,
        cpElementsCount: 4,
        jobCardsCount: 14,
      },
      {
        sectorCode: "OTOMOTIF",
        name: "Teknik Kendaraan Ringan Otomotif",
        description: "Konsentrasi keahlian perawatan mesin, kelistrikan, dan servis kendaraan.",
        totalJp: 792,
        cpElementsCount: 4,
        jobCardsCount: 14,
      },
    ];
  }
}

export async function registerSchool(data: SchoolRegisterInput) {
  const res = await fetch(`${API_BASE_URL}/schools/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    const errorDetails = json as ProblemDetails;
    throw errorDetails;
  }
  return json;
}

export async function fetchDemoSandboxData(): Promise<DemoSandboxData> {
  const res = await fetch(`${API_BASE_URL}/schools/demo-sandbox`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.detail || "Gagal memuat demo sandbox");
  }
  return json.data;
}

export async function fetchCurrentSchool(token: string) {
  const res = await fetch(`${API_BASE_URL}/schools/current`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.detail || "Gagal memuat profil sekolah");
  }
  return json.data;
}

// ─────────────────────────────────────────────────────────
// FR-002: Curriculum & Job Card API helpers
// ─────────────────────────────────────────────────────────

export interface JobCardItem {
  id: string;
  title: string;
  skkniUnitCode: string | null;
  toolsAndSoftware: string[];
  actionVerbTemplate: string;
  isNonCompetency: boolean;
}

export interface CpElementItem {
  id: string;
  code: string;
  title: string;
  targetJp: number;
  sortOrder: number;
  jobCards: JobCardItem[];
}

export interface CurriculumData {
  department: {
    id: string;
    sectorCode: string;
    name: string;
    isLocked: boolean;
  };
  activePeriod: { name: string; targetTotalJp: number };
  currentTotalJp: number;
  jpDelta: number; // positif = kurang, negatif = lebih
  elements: CpElementItem[];
  nonCompetencyCards: JobCardItem[];
}

/** GET /schools/:schoolId/departments/:deptId/curriculum */
export async function fetchCurriculum(
  schoolId: string,
  deptId: string,
  token: string
): Promise<CurriculumData> {
  const res = await fetch(
    `${API_BASE_URL}/schools/${schoolId}/departments/${deptId}/curriculum`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memuat kurikulum");
  return json.data;
}

/** PUT /schools/:schoolId/departments/:deptId/curriculum */
export async function updateCpElements(
  schoolId: string,
  deptId: string,
  elements: { id: string; targetJp: number }[],
  token: string
) {
  const res = await fetch(
    `${API_BASE_URL}/schools/${schoolId}/departments/${deptId}/curriculum`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ elements }),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || json.title || "Gagal menyimpan bobot JP");
  return json;
}

/** POST /schools/:schoolId/departments/:deptId/curriculum/lock */
export async function lockCurriculum(
  schoolId: string,
  deptId: string,
  token: string
) {
  const res = await fetch(
    `${API_BASE_URL}/schools/${schoolId}/departments/${deptId}/curriculum/lock`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal mengunci kurikulum");
  return json;
}

/** POST /schools/:schoolId/departments/:deptId/curriculum/job-cards */
export async function addJobCard(
  schoolId: string,
  deptId: string,
  payload: {
    cpElementId?: string | null;
    title: string;
    skkniUnitCode?: string | null;
    toolsAndSoftware?: string[];
    actionVerbTemplate?: string;
    isNonCompetency?: boolean;
  },
  token: string
) {
  const res = await fetch(
    `${API_BASE_URL}/schools/${schoolId}/departments/${deptId}/curriculum/job-cards`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal menambahkan Job Card");
  return json;
}

/** PATCH /schools/:schoolId/departments/:deptId/curriculum/job-cards/:jcId */
export async function updateJobCard(
  schoolId: string,
  deptId: string,
  jcId: string,
  payload: Partial<{ title: string; skkniUnitCode: string; toolsAndSoftware: string[] }>,
  token: string
) {
  const res = await fetch(
    `${API_BASE_URL}/schools/${schoolId}/departments/${deptId}/curriculum/job-cards/${jcId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memperbarui Job Card");
  return json;
}

/** DELETE /schools/:schoolId/departments/:deptId/curriculum/job-cards/:jcId */
export async function deleteJobCard(
  schoolId: string,
  deptId: string,
  jcId: string,
  token: string
) {
  const res = await fetch(
    `${API_BASE_URL}/schools/${schoolId}/departments/${deptId}/curriculum/job-cards/${jcId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal menghapus Job Card");
  return json;
}

// ─────────────────────────────────────────────────────────
// FR-003: Assisted DUDI Onboarding & Mentor Device Binding
// ─────────────────────────────────────────────────────────

export interface DudiPartnerItem {
  id: string;
  name: string;
  sectorCategory: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  maxQuota: number;
  qualityIndexScore: number | null;
  mentorsCount: number;
  capabilitiesCount: number;
  placementsCount: number;
  mentors: Array<{
    id: string;
    fullName: string;
    jobTitle: string;
    whatsappNumber: string;
    isDeviceBound: boolean;
  }>;
}

export interface DudiDetailData extends DudiPartnerItem {
  supportedJobCards: Array<{
    id: string;
    title: string;
    skkniUnitCode: string | null;
    toolsAndSoftware: string[];
    isNonCompetency: boolean;
    cpElement: { id: string; code: string; title: string } | null;
  }>;
}

/** GET /dudi — Direktori mitra terfederasi */
export async function fetchDudiPartners(
  params?: { search?: string; city?: string; sectorCategory?: string },
  token?: string
): Promise<DudiPartnerItem[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.city) query.set("city", params.city);
  if (params?.sectorCategory) query.set("sectorCategory", params.sectorCategory);

  const res = await fetch(`${API_BASE_URL}/dudi?${query.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memuat direktori DUDI");
  return json.data;
}

/** GET /dudi/:id — Detail DUDI + job cards yang dicentang */
export async function fetchDudiDetail(
  dudiId: string,
  token: string
): Promise<DudiDetailData> {
  const res = await fetch(`${API_BASE_URL}/dudi/${dudiId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memuat detail mitra DUDI");
  return json.data;
}

/** POST /dudi — Pendaftaran DUDI baru & checklist Job Cards */
export async function createDudiPartner(
  payload: {
    name: string;
    sectorCategory: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    maxQuota: number;
    supportedJobCardIds: string[];
  },
  token: string
) {
  const res = await fetch(`${API_BASE_URL}/dudi`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal mendaftarkan mitra DUDI");
  return json;
}

/** POST /dudi/:dudiId/mentors — Daftarkan mentor & buat tautan aktivasi 72 jam */
export async function createDudiMentor(
  dudiId: string,
  payload: {
    fullName: string;
    jobTitle: string;
    whatsappNumber: string;
  },
  token: string
) {
  const res = await fetch(`${API_BASE_URL}/dudi/${dudiId}/mentors`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal mendaftarkan mentor");
  return json;
}

/** POST /dudi/mentors/:mentorId/reset-device — Reset ikatan perangkat (A2) */
export async function resetMentorDevice(mentorId: string, token: string) {
  const res = await fetch(`${API_BASE_URL}/dudi/mentors/${mentorId}/reset-device`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal mereset perangkat mentor");
  return json;
}

/** GET /dudi/verify/:token/activate — Review aktivasi untuk layar HP mentor */
export async function fetchActivationDetails(token: string) {
  const res = await fetch(`${API_BASE_URL}/dudi/verify/${token}/activate`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Tautan aktivasi tidak valid atau kedaluwarsa");
  return json.data;
}

/** POST /dudi/verify/:token/activate — Ikat perangkat mentor dengan PIN */
export async function activateMentorDevice(
  token: string,
  payload: { deviceToken: string; pin: string }
) {
  const res = await fetch(`${API_BASE_URL}/dudi/verify/${token}/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal mengaktifkan perangkat mentor");
  return json;
}


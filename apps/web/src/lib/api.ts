/**
 * API client helper for VokaLink frontend
 */
import type {
  SchoolRegisterInput,
  ProblemDetails,
  HeatmapResponse,
  GenerateInterventionDraftInput,
  InterventionDraftResult,
  CreateInterventionInput,
  RotatePlacementInput,
  RotationExecutionResult,
  EndorsementDetailResponse,
  EndorsementSubmitInput,
  DudiQualityAuditResponse,
  DudiQualityMetricItem,
  SecurityFlagItem,
} from "@vokalink/shared";

export type {
  EndorsementDetailResponse,
  EndorsementSubmitInput,
  DudiQualityAuditResponse,
  DudiQualityMetricItem,
  SecurityFlagItem,
};

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

// ─────────────────────────────────────────────────────────
// FR-004: Smart Placement & Spatial Compatibility API
// ─────────────────────────────────────────────────────────

export interface PlacementCandidateStudent {
  studentId: string;
  fullName: string;
  identityNumber: string;
  department: { id: string; name: string } | null;
  hasCustomCoordinates: boolean;
  homeLatitude: number;
  homeLongitude: number;
  isPlaced: boolean;
  activePlacementId: string | null;
  recommendations: Array<{
    dudiId: string;
    dudiName: string;
    totalScore: number;
    competencyScore: number;
    distanceScore: number;
    distanceKm: number;
    requiresMidtermRotation: boolean;
    remainingQuota: number;
  }>;
  bestRecommendation: {
    dudiId: string;
    dudiName: string;
    totalScore: number;
    competencyScore: number;
    distanceScore: number;
    distanceKm: number;
    requiresMidtermRotation: boolean;
    remainingQuota: number;
  } | null;
}

export interface PlacementCandidateData {
  period: { id: string; name: string; targetTotalJp: number } | null;
  schoolCoordinates: { latitude: number; longitude: number };
  students: PlacementCandidateStudent[];
  teachers: Array<{ id: string; fullName: string; identityNumber: string }>;
  dudis: Array<{
    id: string;
    name: string;
    sectorCategory: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    maxQuota: number;
    activePlacementsCount: number;
    remainingQuota: number;
    mentors: Array<{ id: string; fullName: string; jobTitle: string; isBound: boolean }>;
  }>;
}

export interface PlacementRecordItem {
  id: string;
  academicPeriod: { id: string; name: string };
  student: {
    id: string;
    fullName: string;
    identityNumber: string;
    whatsappNumber: string | null;
    schoolDepartment: { id: string; name: string } | null;
  };
  teacher: { id: string; fullName: string; identityNumber: string };
  dudiPartner: {
    id: string;
    name: string;
    sectorCategory: string;
    city: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  dudiMentor: {
    id: string;
    fullName: string;
    jobTitle: string;
    isDeviceBound: boolean;
  } | null;
  compatibilityScore: number;
  coverageScore: number;
  distanceKm: number;
  requiresMidtermRotation: boolean;
  status: string;
  rotationSequence: number;
  logsCount: number;
  createdAt: string;
}

/** GET /schools/:schoolId/placements/candidates */
export async function fetchPlacementCandidates(
  schoolId: string,
  departmentId?: string,
  token?: string
): Promise<PlacementCandidateData> {
  const query = departmentId ? `?departmentId=${departmentId}` : "";
  const res = await fetch(`${API_BASE_URL}/schools/${schoolId}/placements/candidates${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memuat kandidat penempatan siswa");
  return json.data;
}

/** GET /schools/:schoolId/placements */
export async function fetchPlacements(
  schoolId: string,
  params?: { departmentId?: string; status?: string },
  token?: string
): Promise<PlacementRecordItem[]> {
  const q = new URLSearchParams();
  if (params?.departmentId) q.set("departmentId", params.departmentId);
  if (params?.status) q.set("status", params.status);
  const query = q.toString() ? `?${q.toString()}` : "";

  const res = await fetch(`${API_BASE_URL}/schools/${schoolId}/placements${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memuat daftar penempatan");
  return json.data;
}

/** POST /schools/:schoolId/placements */
export async function createPlacement(
  schoolId: string,
  payload: any,
  token?: string
) {
  const res = await fetch(`${API_BASE_URL}/schools/${schoolId}/placements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal menyimpan penempatan siswa");
  return json;
}

/** POST /schools/:schoolId/placements/batch */
export async function batchCreatePlacements(
  schoolId: string,
  payload: { placements: any[] },
  token?: string
) {
  const res = await fetch(`${API_BASE_URL}/schools/${schoolId}/placements/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal menyimpan penempatan massal");
  return json;
}

/** PATCH /schools/:schoolId/placements/students/:studentId/coordinates */
export async function updateStudentCoordinates(
  schoolId: string,
  studentId: string,
  payload: { homeLatitude: number; homeLongitude: number },
  token?: string
) {
  const res = await fetch(
    `${API_BASE_URL}/schools/${schoolId}/placements/students/${studentId}/coordinates`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memperbarui koordinat siswa");
  return json;
}

// ─────────────────────────────────────────────────────────
// FR-011: e-Rapor SMK Grade & Narrative Exporter API
// ─────────────────────────────────────────────────────────

export interface EraporStudentRecord {
  placementId: string;
  student: {
    id: string;
    fullName: string;
    identityNumber: string;
    department: { id: string; name: string } | null;
  };
  dudiPartner: {
    id: string;
    name: string;
    city: string;
  };
  teacher: {
    id: string;
    fullName: string;
  };
  totalVerifiedJp: number;
  pendingLogsCount: number;
  elements: Array<{
    elementId: string;
    elementCode: string;
    elementTitle: string;
    targetJp: number;
    verifiedJp: number;
    autonomyScore: number;
    score: number;
  }>;
  officialElements?: Array<{
    code: string;
    title: string;
    category: string;
    weight: number;
    score: number;
    predicate: string;
    description: string;
  }>;
  attitudeScore: number | null;
  isAttitudeIncluded: boolean;
  finalGrade: number;
  highestAchievement: string;
  needsImprovement: string;
}

export interface EraporSummaryResponse {
  school: { id: string; name: string };
  totalStudents: number;
  studentsWithPendingLogsCount: number;
  warningMessage: string | null;
  records: EraporStudentRecord[];
}

/** GET /schools/:schoolId/erapor (JSON) */
export async function fetchEraporData(
  schoolId: string,
  params?: { departmentId?: string; academicPeriodId?: string },
  token?: string
): Promise<EraporSummaryResponse> {
  const q = new URLSearchParams();
  if (params?.departmentId) q.set("departmentId", params.departmentId);
  if (params?.academicPeriodId) q.set("academicPeriodId", params.academicPeriodId);
  const query = q.toString() ? `?${q.toString()}` : "";

  const res = await fetch(`${API_BASE_URL}/schools/${schoolId}/erapor${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memuat rekap e-Rapor");
  return json.data;
}

/** GET /schools/:schoolId/erapor?format=csv (Blob Download) */
export async function downloadEraporCsv(
  schoolId: string,
  params?: { departmentId?: string; academicPeriodId?: string },
  token?: string
): Promise<Blob> {
  const q = new URLSearchParams();
  q.set("format", "csv");
  if (params?.departmentId) q.set("departmentId", params.departmentId);
  if (params?.academicPeriodId) q.set("academicPeriodId", params.academicPeriodId);

  const res = await fetch(`${API_BASE_URL}/schools/${schoolId}/erapor?${q.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.detail || "Gagal mengunduh berkas CSV e-Rapor");
  }
  return await res.blob();
}

// ─── Student ATS-CV & Skill Passport (FR-012) ──────────────────────────────

export interface StudentCvResponse {
  student: {
    id: string;
    fullName: string;
    identityNumber: string;
    whatsappNumber?: string;
    departmentName: string;
    schoolName: string;
    schoolAddress?: string;
  };
  summaryBio: string;
  totalVerifiedJp: number;
  totalRealHours?: number;
  technicalJp: number;
  nonCompetencyJp: number;
  completedTasksCount?: number;
  experiences: Array<{
    placementId: string;
    dudiName: string;
    dudiCity?: string;
    roleTitle: string;
    periodLabel: string;
    mentorName?: string;
    totalVerifiedJp: number;
    totalRealHours?: number;
    technicalJp: number;
    nonCompetencyJp: number;
    bulletPoints: Array<{
      jobCardId: string;
      jobCardTitle: string;
      skkniUnitCode: string | null;
      totalJp: number;
      totalRealHours?: number;
      taskCount: number;
      predominantAutonomyLevel: 1 | 2 | 3;
      autonomyLabel: "Mandiri" | "Terbimbing" | "Observasi" | string;
      toolsUsed: string[];
      bulletText: string;
    }>;
  }>;
  technicalSkills: Array<{
    name: string;
    totalJp: number;
    totalRealHours?: number;
  }>;
  endorsement?: {
    attitudeScore: number;
    badges: string[];
    quote: string | null;
    mentorName: string;
    dudiName: string;
  } | null;
  extraActivities: Array<{
    title: string;
    year: string;
    description: string;
  }>;
  visibility?: {
    showPhotos?: boolean;
    showGrades?: boolean;
  };
  passportSlug: string;
  verificationUrl: string;
  masterSignatureHash: string | null;
}

export interface PublicPassportResponse {
  isCryptographicallyValid: boolean;
  statusLabel: string;
  passportSlug: string;
  masterSignatureHash: string;
  student: {
    fullName: string;
    identityNumber: string;
    departmentName: string;
    schoolName: string;
    schoolAddress?: string;
  };
  summaryBio: string | null;
  metrics: {
    totalVerifiedJp: number;
    totalRealHours?: number;
    technicalJp: number;
    nonCompetencyJp: number;
    verifiedDaysCount: number;
    dudiCount: number;
  };
  competencies: Array<{
    id: string;
    code: string;
    title: string;
    targetJp: number;
    verifiedJp: number;
    percentage: number;
  }>;
  endorsement: {
    attitudeScore: number;
    badges: string[];
    quote: string | null;
    mentorName: string;
    dudiName: string;
  } | null;
  artifactPhotos: string[];
  extraActivities: any[];
  verifiedAt: string;
}

/** GET /students/me/cv */
export async function fetchStudentCv(studentId?: string): Promise<StudentCvResponse> {
  const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
  const res = await fetch(`${API_BASE_URL}/students/me/cv${query}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memuat data CV ATS siswa");
  return json;
}

/** PATCH /students/me/passport */
export async function updateStudentPassport(
  data: {
    summaryBio?: string;
    extraActivities?: any[];
    visibility?: { showPhotos?: boolean; showGrades?: boolean };
  },
  studentId?: string
): Promise<{ success: boolean; message: string }> {
  const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
  const res = await fetch(`${API_BASE_URL}/students/me/passport${query}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memperbarui paspor kompetensi");
  return json;
}

/** GET /passports/:slug */
export async function fetchPublicPassport(slug: string): Promise<PublicPassportResponse> {
  const res = await fetch(`${API_BASE_URL}/passports/${encodeURIComponent(slug)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Paspor kompetensi tidak ditemukan");
  return json;
}

export interface StudentLogContextResponse {
  student: {
    id: string;
    fullName: string;
    departmentName: string;
    schoolName: string;
  };
  activePlacement: {
    id: string;
    dudiName: string;
    dudiCity: string;
    mentorName: string;
  } | null;
  jobCards: Array<{
    id: string;
    title: string;
    tools: string[];
    skkni?: string | null;
    category: string;
  }>;
  nonCompetencyJobCard: {
    id: string;
    title: string;
  } | null;
}

/** GET /students/me/log-context */
export async function fetchStudentLogContext(
  studentId?: string
): Promise<StudentLogContextResponse> {
  const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
  const res = await fetch(`${API_BASE_URL}/students/me/log-context${query}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memuat konteks penempatan dan job card");
  return json;
}

// ─────────────────────────────────────────────────────────
// FR-007: Zero-Login Mentor Verification & Batch Approval
// ─────────────────────────────────────────────────────────

export interface MentorVerifyDetailsResponse {
  valid: boolean;
  mode: "QR" | "WA_BATCH";
  expiresAt: string;
  nonce: string;
  mentor: {
    id: string;
    fullName: string;
    jobTitle: string;
    dudiName: string;
    hasDeviceBound: boolean;
    isLocked: boolean;
    lockedUntil: string | null;
  };
  student: {
    id: string;
    fullName: string;
    identityNumber: string;
    departmentName: string;
    schoolName: string;
  };
  placement: {
    id: string;
    dudiName: string;
    city: string;
  };
  logs: Array<{
    id: string;
    clientLogUuid: string;
    logDate: string;
    attendanceType: "PRESENT" | "SICK" | "PERMIT";
    shortNote: string | null;
    evidenceWebpUrl: string | null;
    totalDurationJp: number;
    items: Array<{
      id: string;
      jobCardId: string;
      title: string;
      skkniUnitCode: string | null;
      durationJp: number;
      autonomyLevel: number;
      autonomyLabel: "Mandiri" | "Terbimbing" | "Observasi";
      isNonCompetency: boolean;
      nonCompetencyCategory?: string | null;
    }>;
  }>;
}

export interface MentorVerifyExecuteInput {
  nonce: string;
  deviceToken: string;
  pin: string;
  decision: "APPROVE" | "REJECT";
  rejectionReason?: string;
  correctedItems?: Array<{
    itemId: string;
    durationJp: number;
    autonomyLevel: 1 | 2 | 3;
  }>;
}

/** GET /api/v1/verify/mentor/:token */
export async function fetchMentorVerifyDetails(
  token: string
): Promise<MentorVerifyDetailsResponse> {
  const res = await fetch(`${API_BASE_URL}/verify/mentor/${encodeURIComponent(token)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memuat data verifikasi mentor");
  return json;
}

/** POST /api/v1/verify/mentor/:token/check-device */
export async function checkMentorDevice(
  token: string,
  deviceToken: string | null
): Promise<{ recognized: boolean; isLocked: boolean; hasDeviceBound: boolean }> {
  const res = await fetch(
    `${API_BASE_URL}/verify/mentor/${encodeURIComponent(token)}/check-device`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceToken }),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memeriksa status perangkat");
  return json;
}

/** POST /api/v1/verify/mentor/:token/execute */
export async function executeMentorVerification(
  token: string,
  data: MentorVerifyExecuteInput
): Promise<{
  success: boolean;
  decision: string;
  processedCount: number;
  message: string;
  verifiedAt: string;
}> {
  const res = await fetch(`${API_BASE_URL}/verify/mentor/${encodeURIComponent(token)}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memproses verifikasi logbook");
  return json;
}

/** POST /api/v1/verify/links */
export async function generateVerificationLink(data: {
  placementId: string;
  logIds?: string[];
  mode?: "QR" | "WA_BATCH";
}): Promise<{
  token: string;
  verificationUrl: string;
  fullUrl: string;
  waShareUrl: string | null;
  mode: string;
  expiresAt: string;
  pendingCount: number;
}> {
  const res = await fetch(`${API_BASE_URL}/verify/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal membuat tautan verifikasi");
  return json;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FR-008: Live Competency Heatmap & Drift Alert API (Portal Guru)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function fetchTeacherHeatmap(params?: {
  departmentId?: string;
  dudiId?: string;
  driftOnly?: boolean;
}): Promise<HeatmapResponse> {
  const query = new URLSearchParams();
  if (params?.departmentId) query.set("departmentId", params.departmentId);
  if (params?.dudiId) query.set("dudiId", params.dudiId);
  if (params?.driftOnly) query.set("driftOnly", "true");

  const qs = query.toString();
  const url = `${API_BASE_URL}/teachers/heatmap${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memuat matriks heatmap kompetensi");
  return json;
}

export async function fetchTeacherDriftAlerts(): Promise<{ alerts: any[] }> {
  const res = await fetch(`${API_BASE_URL}/teachers/drift-alerts`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memuat daftar peringatan drift");
  return json;
}

export async function triggerEvaluateDriftAlerts(): Promise<{
  success: boolean;
  evaluatedCount: number;
  activeAlertsCreatedOrUpdated: number;
  message: string;
}> {
  const res = await fetch(`${API_BASE_URL}/teachers/drift-alerts/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal mengevaluasi algoritma drift");
  return json;
}

/**
 * FR-007 A2 & TC-006: Audit Keamanan Dasbor Guru
 */
export async function fetchSecurityFlags(): Promise<{ flags: SecurityFlagItem[] }> {
  const res = await fetch(`${API_BASE_URL}/teachers/security-flags`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memuat bendera audit keamanan");
  return json;
}

export async function acknowledgeSecurityFlag(
  id: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/teachers/security-flags/${id}/acknowledge`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal menandai bendera audit");
  return json;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FR-009: Smart Intervention Dispatcher & Mid-Term Rotation API
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function fetchInterventionDraft(
  params: GenerateInterventionDraftInput
): Promise<InterventionDraftResult> {
  const res = await fetch(`${API_BASE_URL}/interventions/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal menyusun draf pesan koordinasi");
  return json;
}

export async function submitIntervention(
  data: CreateInterventionInput
): Promise<{ success: boolean; intervention: any; message: string }> {
  const res = await fetch(`${API_BASE_URL}/interventions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal mencatat intervensi pembimbing");
  return json;
}

export async function executePlacementRotation(
  data: RotatePlacementInput
): Promise<RotationExecutionResult> {
  const res = await fetch(`${API_BASE_URL}/placements/rotate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal mengeksekusi rotasi mitra DUDI");
  return json;
}

export async function fetchInterventions(): Promise<{ interventions: any[] }> {
  const res = await fetch(`${API_BASE_URL}/interventions`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memuat riwayat intervensi");
  return json;
}

// ─────────────────────────────────────────────────────────
// FR-010: 1-Click Soft Skills Endorsement & DUDI Quality Index
// ─────────────────────────────────────────────────────────

export async function fetchEndorsementDetails(
  token: string
): Promise<EndorsementDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/endorsements/${encodeURIComponent(token)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memuat formulir endorsement");
  return json;
}

export async function submitEndorsement(
  token: string,
  payload: EndorsementSubmitInput
): Promise<{ message: string; endorsement: any }> {
  const res = await fetch(`${API_BASE_URL}/endorsements/${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal mengesahkan endorsement etos kerja");
  return json;
}

export async function generateEndorsementLink(
  placementId: string,
  studentId?: string
): Promise<{
  token: string;
  url: string;
  endorseUrl: string;
  waLink: string;
  expiresAt: string;
  studentName: string;
  mentorName: string;
}> {
  const res = await fetch(`${API_BASE_URL}/endorsements/generate-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ placementId, studentId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal menerbitkan tautan endorsement");
  return json;
}

export async function fetchDudiQualityIndex(params?: {
  sectorCategory?: string;
}): Promise<DudiQualityAuditResponse> {
  const query = params?.sectorCategory
    ? `?sectorCategory=${encodeURIComponent(params.sectorCategory)}`
    : "";
  const res = await fetch(`${API_BASE_URL}/dudi/quality-index${query}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Gagal memuat audit mutu kemitraan DUDI");
  return json;
}




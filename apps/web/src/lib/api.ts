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

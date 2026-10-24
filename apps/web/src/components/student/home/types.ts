import type { LogSyncState } from "@/lib/pwa/db";

export type CategoryColor = "teal" | "sky" | "indigo" | "rose" | "amber";

export interface KanbanTask {
  id: string;
  title: string;
  category: string;
  categoryColor: CategoryColor;
  date: string;
  durationJp: number;
  progressPercent: number;
  autonomyLabel: string;
  skkniUnitCode: string;
  status: "in_progress" | "in_review" | "verified";
  tools: string[];
  submittedAt?: string;
  mentorSignature?: string;
  hmacVerified?: boolean;
  syncState?: LogSyncState | string;
  isLocalDexie?: boolean;
  shortNote?: string;
}

export interface StudentInfo {
  name: string;
  email: string;
  nisn: string;
  school: string;
  major: string;
  dudi: string;
  mentor: string;
  city: string;
  verifiedJp: number;
  pendingJp: number;
  targetJp: number;
}

/**
 * Format date YYYY-MM-DD to Indonesian format (e.g., 23 Okt 2026)
 */
export function formatLogDate(dateStr: string): string {
  if (!dateStr) return "Hari Ini";
  try {
    const parts = dateStr.split("-");
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    if (!year || !month || !day) return dateStr;
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
    ];
    const monthIdx = parseInt(month, 10) - 1;
    return `${parseInt(day, 10)} ${months[monthIdx] || month} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Clean neutral badges with soft tinted text
 */
export function getCategoryBadgeStyle(color: CategoryColor): string {
  switch (color) {
    case "sky":
      return "bg-sky-50 text-sky-700 border border-sky-200/80";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200/80";
  }
}

/**
 * 6px sector bullet dot for visual domain anchoring
 */
export function getCategoryDotColor(color: CategoryColor): string {
  switch (color) {
    case "teal":
      return "bg-teal-500";
    case "sky":
      return "bg-sky-500";
    case "indigo":
      return "bg-indigo-500";
    case "rose":
      return "bg-rose-500";
    case "amber":
      return "bg-amber-500";
    default:
      return "bg-slate-400";
  }
}

/**
 * Short label for compact card display
 */
export function getCategoryShortLabel(category: string): string {
  switch (category) {
    case "Pemrograman Web & Mobile":
      return "Web & Mobile";
    case "Basis Data Relasional":
      return "Basis Data";
    case "Tugas Umum Non-Kompetensi":
      return "Tugas Umum";
    case "Testing & QA":
      return "Testing & QA";
    case "Cloud & DevOps":
      return "Cloud & DevOps";
    default:
      return category;
  }
}

export const DEFAULT_KANBAN_TASKS: KanbanTask[] = [
  {
    id: "task-1",
    title: "Implementasi REST API & Router Express",
    category: "Pemrograman Web & Mobile",
    categoryColor: "sky",
    date: "10 Okt 2026",
    durationJp: 8,
    progressPercent: 73,
    autonomyLabel: "Mandiri",
    skkniUnitCode: "J.620100.009.01",
    status: "in_progress",
    tools: ["Express", "TypeScript", "Node.js"],
  },
  {
    id: "task-2",
    title: "Perancangan Skema PostgreSQL & Trigger",
    category: "Basis Data Relasional",
    categoryColor: "teal",
    date: "9 Okt 2026",
    durationJp: 8,
    progressPercent: 84,
    autonomyLabel: "Terbimbing",
    skkniUnitCode: "J.620100.010.01",
    status: "in_review",
    tools: ["PostgreSQL", "Prisma", "Supabase"],
    submittedAt: "16 jam yang lalu",
  },
  {
    id: "task-3",
    title: "Tugas Umum Operasional DUDI",
    category: "Tugas Umum Non-Kompetensi",
    categoryColor: "rose",
    date: "9 Okt 2026",
    durationJp: 4,
    progressPercent: 65,
    autonomyLabel: "Administrasi Sistem",
    skkniUnitCode: "NON_COMP_ADMIN",
    status: "in_review",
    tools: ["SOP Industri", "Manajemen File"],
    submittedAt: "1 hari yang lalu",
  },
  {
    id: "task-4",
    title: "Pengujian Unit & QA Penjaminan Mutu",
    category: "Testing & QA",
    categoryColor: "amber",
    date: "8 Okt 2026",
    durationJp: 8,
    progressPercent: 100,
    autonomyLabel: "Mandiri",
    skkniUnitCode: "J.620100.015.01",
    status: "verified",
    tools: ["Vitest", "Supertest"],
    mentorSignature: "Rizky Firmansyah",
    hmacVerified: true,
  },
  {
    id: "task-5",
    title: "Penerapan Arsitektur Cloud & CI/CD Pipeline",
    category: "Cloud & DevOps",
    categoryColor: "indigo",
    date: "7 Okt 2026",
    durationJp: 6,
    progressPercent: 100,
    autonomyLabel: "Mandiri",
    skkniUnitCode: "J.620100.020.01",
    status: "verified",
    tools: ["Docker", "Cloudflare", "Coolify"],
    mentorSignature: "Rizky Firmansyah",
    hmacVerified: true,
  },
  {
    id: "task-6",
    title: "Perancangan UI Komponen & Design System",
    category: "Pemrograman Web & Mobile",
    categoryColor: "sky",
    date: "6 Okt 2026",
    durationJp: 8,
    progressPercent: 100,
    autonomyLabel: "Mandiri",
    skkniUnitCode: "J.620100.005.01",
    status: "verified",
    tools: ["Next.js", "Tailwind CSS"],
    mentorSignature: "Rizky Firmansyah",
    hmacVerified: true,
  },
];

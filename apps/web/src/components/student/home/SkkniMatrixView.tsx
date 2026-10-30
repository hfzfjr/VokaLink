"use client";

import React, { useState, useMemo } from "react";
import {
  Code2,
  Database,
  CheckCircle,
  Cloud,
  Search,
  X,
  LayoutList,
  LayoutGrid,
  Inbox,
  ChevronDown,
  Calculator,
  FileSpreadsheet,
  FileText,
  Coins,
  Wrench,
  Gauge,
  Palette,
  PenTool,
  Video,
  Utensils,
  Pill,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface SkkniModule {
  id: string;
  title: string;
  code: string;
  badgeLevel: string;
  badgeColor: {
    bg: string;
    border: string;
    text: string;
    dot: string;
  };
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconText: string;
  progressBarColor: string;
  description: string;
  verifiedJp: number;
  targetJp: number;
  percentage: number;
  skills: string[];
}

const MODULES: SkkniModule[] = [
  {
    id: "web-mobile",
    title: "Pemrograman Web & Mobile",
    code: "J.620100.009.01",
    badgeLevel: "Mahir (Ready)",
    badgeColor: {
      bg: "bg-emerald-50",
      border: "border-emerald-200/80",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    icon: Code2,
    iconBg: "bg-sky-50 border-sky-100 group-hover:bg-sky-500 group-hover:text-white",
    iconText: "text-sky-600",
    progressBarColor: "bg-sky-500",
    description:
      "Perancangan arsitektur REST API modular, router Express, middleware autentikasi, serta integrasi frontend React/Next.js.",
    verifiedJp: 128,
    targetJp: 240,
    percentage: 53,
    skills: ["Express.js", "TypeScript", "Next.js", "RESTful API", "JWT"],
  },
  {
    id: "database",
    title: "Basis Data Relasional",
    code: "J.620100.010.01",
    badgeLevel: "Menengah-Lanjut",
    badgeColor: {
      bg: "bg-teal-50",
      border: "border-teal-200/80",
      text: "text-teal-700",
      dot: "bg-teal-500",
    },
    icon: Database,
    iconBg: "bg-teal-50 border-teal-100 group-hover:bg-teal-600 group-hover:text-white",
    iconText: "text-teal-700",
    progressBarColor: "bg-teal-500",
    description:
      "Pemodelan data relasional 3NF, pembuatan skema PostgreSQL, penulisan trigger database, audit immutability, dan ORM Prisma.",
    verifiedJp: 80,
    targetJp: 160,
    percentage: 50,
    skills: ["PostgreSQL", "Prisma ORM", "Database Triggers", "Supavisor"],
  },
  {
    id: "software-qa",
    title: "Software QA & Penjaminan Mutu",
    code: "J.620100.015.01",
    badgeLevel: "Menengah",
    badgeColor: {
      bg: "bg-amber-50",
      border: "border-amber-200/80",
      text: "text-amber-800",
      dot: "bg-amber-500",
    },
    icon: CheckCircle,
    iconBg: "bg-amber-50 border-amber-100 group-hover:bg-amber-500 group-hover:text-white",
    iconText: "text-amber-600",
    progressBarColor: "bg-amber-500",
    description:
      "Pengujian unit deterministik, automated endpoint testing dengan Supertest, verifikasi format RFC 7807, dan validasi Zod.",
    verifiedJp: 48,
    targetJp: 120,
    percentage: 40,
    skills: ["Vitest", "Supertest", "Zod", "RFC 7807", "Test Automation"],
  },
  {
    id: "devops",
    title: "Cloud Architecture & DevOps",
    code: "J.620100.020.01",
    badgeLevel: "Dasar-Menengah",
    badgeColor: {
      bg: "bg-indigo-50",
      border: "border-indigo-200/80",
      text: "text-indigo-700",
      dot: "bg-indigo-500",
    },
    icon: Cloud,
    iconBg: "bg-indigo-50 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white",
    iconText: "text-indigo-600",
    progressBarColor: "bg-indigo-500",
    description:
      "Kontainerisasi microservice Docker, deployment mandiri via Coolify di Home Server, routing terowongan Cloudflare Tunnel, dan zero-cost monitoring.",
    verifiedJp: 32,
    targetJp: 120,
    percentage: 27,
    skills: ["Docker", "Coolify", "Cloudflare Tunnel", "Linux CI/CD"],
  },
];

const MODULES_BY_SECTOR: Record<string, SkkniModule[]> = {
  AKL: [
    {
      id: "akl-jurnal",
      title: "Akuntansi Keuangan — Siklus Jurnal",
      code: "M.692000.003.02",
      badgeLevel: "Mahir (Ready)",
      badgeColor: { bg: "bg-emerald-50", border: "border-emerald-200/80", text: "text-emerald-700", dot: "bg-emerald-500" },
      icon: Calculator,
      iconBg: "bg-emerald-50 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white",
      iconText: "text-emerald-700",
      progressBarColor: "bg-emerald-500",
      description: "Pencatatan transaksi penerimaan kas, pengeluaran kas, mutasi bank, dan pembuatan entri jurnal penyesuaian harian.",
      verifiedJp: 110,
      targetJp: 180,
      percentage: 61,
      skills: ["Microsoft Excel", "MYOB", "Accurate", "Jurnal Penyesuaian", "Buku Besar"],
    },
    {
      id: "akl-laporan",
      title: "Penyusunan & Analisis Laporan Keuangan",
      code: "M.692000.008.02",
      badgeLevel: "Menengah-Lanjut",
      badgeColor: { bg: "bg-sky-50", border: "border-sky-200/80", text: "text-sky-700", dot: "bg-sky-500" },
      icon: FileSpreadsheet,
      iconBg: "bg-sky-50 border-sky-100 group-hover:bg-sky-600 group-hover:text-white",
      iconText: "text-sky-700",
      progressBarColor: "bg-sky-500",
      description: "Penyusunan neraca lajur, laporan laba rugi, perubahan ekuitas, dan rekonsiliasi catatan kas dengan rekening koran.",
      verifiedJp: 96,
      targetJp: 180,
      percentage: 53,
      skills: ["Neraca Saldo", "Laba Rugi", "Rekonsiliasi Bank", "Arus Kas"],
    },
    {
      id: "akl-pajak",
      title: "Administrasi & Pelaporan Perpajakan",
      code: "M.692000.016.02",
      badgeLevel: "Menengah",
      badgeColor: { bg: "bg-amber-50", border: "border-amber-200/80", text: "text-amber-800", dot: "bg-amber-500" },
      icon: FileText,
      iconBg: "bg-amber-50 border-amber-100 group-hover:bg-amber-600 group-hover:text-white",
      iconText: "text-amber-700",
      progressBarColor: "bg-amber-500",
      description: "Perhitungan PPh Pasal 21/23, pembuatan faktur pajak keluaran/masukan, dan pelaporan SPT masa melalui aplikasi DJP.",
      verifiedJp: 64,
      targetJp: 144,
      percentage: 44,
      skills: ["e-Faktur DJP", "e-Filing", "PPh 21", "PPN", "SPT Masa"],
    },
    {
      id: "akl-kas-persediaan",
      title: "Administrasi Kas Kecil & Kartu Stok",
      code: "M.692000.021.02",
      badgeLevel: "Dasar-Menengah",
      badgeColor: { bg: "bg-indigo-50", border: "border-indigo-200/80", text: "text-indigo-700", dot: "bg-indigo-500" },
      icon: Coins,
      iconBg: "bg-indigo-50 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white",
      iconText: "text-indigo-700",
      progressBarColor: "bg-indigo-500",
      description: "Pengelolaan dana kas kecil metode imprest/fluktuasi, verifikasi voucher tagihan vendor, dan opname fisik stok barang.",
      verifiedJp: 52,
      targetJp: 144,
      percentage: 36,
      skills: ["Petty Cash", "Voucher Kas", "Kartu Stok", "Opname Fisik"],
    },
  ],
  OTOMOTIF: [
    {
      id: "oto-mesin",
      title: "Servis Berkala & Perawatan Mesin EFI",
      code: "G.45OTO01.001.2",
      badgeLevel: "Mahir (Ready)",
      badgeColor: { bg: "bg-emerald-50", border: "border-emerald-200/80", text: "text-emerald-700", dot: "bg-emerald-500" },
      icon: Wrench,
      iconBg: "bg-emerald-50 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white",
      iconText: "text-emerald-700",
      progressBarColor: "bg-emerald-500",
      description: "Servis berkala kendaraan ringan, penggantian pelumas & filter, tune-up mesin bensin konvensional dan sistem injeksi EFI.",
      verifiedJp: 120,
      targetJp: 216,
      percentage: 56,
      skills: ["Tune-up EFI", "Ganti Oli & Filter", "Kunci Torsi", "Mikrometer", "Lift Hidrolik"],
    },
    {
      id: "oto-chassis",
      title: "Sistem Rem, Suspensi & Kemudi",
      code: "G.45OTO01.010.2",
      badgeLevel: "Menengah-Lanjut",
      badgeColor: { bg: "bg-sky-50", border: "border-sky-200/80", text: "text-sky-700", dot: "bg-sky-500" },
      icon: Gauge,
      iconBg: "bg-sky-50 border-sky-100 group-hover:bg-sky-600 group-hover:text-white",
      iconText: "text-sky-700",
      progressBarColor: "bg-sky-500",
      description: "Pembongkaran, pemeriksaan, dan penyetelan sistem rem hidrolik/ABS, penggantian kampas rem, dan pengecekan suspensi.",
      verifiedJp: 104,
      targetJp: 216,
      percentage: 48,
      skills: ["Brake Bleeder", "Dial Gauge", "Overhaul Rem", "Spooring Balancing"],
    },
    {
      id: "oto-kelistrikan",
      title: "Diagnosa Kelistrikan & Sensor ECU",
      code: "G.45OTO01.012.2",
      badgeLevel: "Menengah",
      badgeColor: { bg: "bg-amber-50", border: "border-amber-200/80", text: "text-amber-800", dot: "bg-amber-500" },
      icon: CheckCircle,
      iconBg: "bg-amber-50 border-amber-100 group-hover:bg-amber-600 group-hover:text-white",
      iconText: "text-amber-700",
      progressBarColor: "bg-amber-500",
      description: "Diagnosa gangguan kelistrikan mesin dan bodi menggunakan Scanner OBD-II, pembacaan live data stream, dan wiring diagram.",
      verifiedJp: 72,
      targetJp: 180,
      percentage: 40,
      skills: ["Scanner OBD-II", "Multimeter Digital", "Wiring Diagram", "Uji Sensor"],
    },
    {
      id: "oto-transmisi",
      title: "Transmisi, AC & Perbaikan Kendaraan",
      code: "G.45OTO01.015.2",
      badgeLevel: "Dasar-Menengah",
      badgeColor: { bg: "bg-indigo-50", border: "border-indigo-200/80", text: "text-indigo-700", dot: "bg-indigo-500" },
      icon: Cloud,
      iconBg: "bg-indigo-50 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white",
      iconText: "text-indigo-700",
      progressBarColor: "bg-indigo-500",
      description: "Pemeriksaan kopling manual, fluida transmisi otomatis, uji kebocoran refrigeran AC mobil, dan pengisian freon.",
      verifiedJp: 54,
      targetJp: 180,
      percentage: 30,
      skills: ["Manifold Gauge", "Leak Detector", "Servis Kopling", "Fluida Transmisi"],
    },
  ],
  DKV: [
    {
      id: "dkv-branding",
      title: "Desain Grafis & Identitas Visual (Branding)",
      code: "M.74100.001.01",
      badgeLevel: "Mahir (Ready)",
      badgeColor: { bg: "bg-emerald-50", border: "border-emerald-200/80", text: "text-emerald-700", dot: "bg-emerald-500" },
      icon: Palette,
      iconBg: "bg-emerald-50 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white",
      iconText: "text-emerald-700",
      progressBarColor: "bg-emerald-500",
      description: "Perancangan logo vektor, corporate identity, brand guideline, dan pembuatan konten visual media sosial berkala.",
      verifiedJp: 118,
      targetJp: 198,
      percentage: 60,
      skills: ["Adobe Illustrator", "Photoshop", "Figma", "Branding", "Vektor"],
    },
    {
      id: "dkv-ilustrasi",
      title: "Ilustrasi Digital & Karakter",
      code: "M.74100.005.01",
      badgeLevel: "Menengah-Lanjut",
      badgeColor: { bg: "bg-sky-50", border: "border-sky-200/80", text: "text-sky-700", dot: "bg-sky-500" },
      icon: PenTool,
      iconBg: "bg-sky-50 border-sky-100 group-hover:bg-sky-600 group-hover:text-white",
      iconText: "text-sky-700",
      progressBarColor: "bg-sky-500",
      description: "Pembuatan aset gambar ilustrasi digital, desain maskot karakter, dan pewarnaan digital untuk kebutuhan publikasi komersial.",
      verifiedJp: 92,
      targetJp: 198,
      percentage: 46,
      skills: ["Pen Tablet", "Clip Studio Paint", "Procreate", "Desain Karakter"],
    },
    {
      id: "dkv-layout",
      title: "Tata Letak & Tipografi Media Cetak",
      code: "M.74100.008.01",
      badgeLevel: "Menengah",
      badgeColor: { bg: "bg-amber-50", border: "border-amber-200/80", text: "text-amber-800", dot: "bg-amber-500" },
      icon: FileText,
      iconBg: "bg-amber-50 border-amber-100 group-hover:bg-amber-600 group-hover:text-white",
      iconText: "text-amber-700",
      progressBarColor: "bg-amber-500",
      description: "Layouting buku, majalah, katalog produk, dan brosur promosi cetak dengan grid system dan hierarki tipografi standar industri.",
      verifiedJp: 78,
      targetJp: 198,
      percentage: 39,
      skills: ["Adobe InDesign", "Illustrator", "Grid System", "Pre-press Cetak"],
    },
    {
      id: "dkv-video",
      title: "Media Bergerak & Fotografi Produk",
      code: "M.74100.011.01",
      badgeLevel: "Dasar-Menengah",
      badgeColor: { bg: "bg-indigo-50", border: "border-indigo-200/80", text: "text-indigo-700", dot: "bg-indigo-500" },
      icon: Video,
      iconBg: "bg-indigo-50 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white",
      iconText: "text-indigo-700",
      progressBarColor: "bg-indigo-500",
      description: "Editing video promosi, pembuatan motion graphics bumper, dan pemotretan produk studio dengan tata pencahayaan 3-point lighting.",
      verifiedJp: 62,
      targetJp: 198,
      percentage: 31,
      skills: ["Premiere Pro", "After Effects", "DSLR/Mirrorless", "Lighting Studio"],
    },
  ],
  KULINER: [
    {
      id: "kul-mise",
      title: "Mise en Place & Sanitasi Hygiene (HACCP)",
      code: "I.55HDR00.001.2",
      badgeLevel: "Mahir (Ready)",
      badgeColor: { bg: "bg-emerald-50", border: "border-emerald-200/80", text: "text-emerald-700", dot: "bg-emerald-500" },
      icon: Utensils,
      iconBg: "bg-emerald-50 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white",
      iconText: "text-emerald-700",
      progressBarColor: "bg-emerald-500",
      description: "Persiapan bahan baku mentah sesuai resep, teknik pemotongan standar (knife cuts), dan penerapan kebersihan dapur standar HACCP.",
      verifiedJp: 124,
      targetJp: 198,
      percentage: 63,
      skills: ["Pisau Chef", "Knife Cuts", "Sanitasi HACCP", "Timbangan Digital"],
    },
    {
      id: "kul-hotkitchen",
      title: "Pengolahan Hidangan Utama (Hot Kitchen)",
      code: "I.55HDR00.010.2",
      badgeLevel: "Menengah-Lanjut",
      badgeColor: { bg: "bg-sky-50", border: "border-sky-200/80", text: "text-sky-700", dot: "bg-sky-500" },
      icon: CheckCircle,
      iconBg: "bg-sky-50 border-sky-100 group-hover:bg-sky-600 group-hover:text-white",
      iconText: "text-sky-700",
      progressBarColor: "bg-sky-500",
      description: "Memasak hidangan utama nusantara dan kontinental dengan teknik sautéing, roasting, simmering, serta pengujian suhu kematangan.",
      verifiedJp: 98,
      targetJp: 198,
      percentage: 49,
      skills: ["Kompor Industri", "Wok", "Sauté", "SOP Resep Standar"],
    },
    {
      id: "kul-pastry",
      title: "Pastry, Bakery, & Dessert",
      code: "I.55HDR00.015.2",
      badgeLevel: "Menengah",
      badgeColor: { bg: "bg-amber-50", border: "border-amber-200/80", text: "text-amber-800", dot: "bg-amber-500" },
      icon: Database,
      iconBg: "bg-amber-50 border-amber-100 group-hover:bg-amber-600 group-hover:text-white",
      iconText: "text-amber-700",
      progressBarColor: "bg-amber-500",
      description: "Pembuatan adonan roti ragi, kue pastry lapis, cake, dan dessert dingin dengan ketepatan formulasi bahan dan suhu baking.",
      verifiedJp: 74,
      targetJp: 198,
      percentage: 37,
      skills: ["Mixer Planetary", "Deck Oven", "Formulasi Adonan", "Pastry"],
    },
    {
      id: "kul-plating",
      title: "Pelayanan Restoran, Plating & Inventory",
      code: "I.55HDR00.020.2",
      badgeLevel: "Dasar-Menengah",
      badgeColor: { bg: "bg-indigo-50", border: "border-indigo-200/80", text: "text-indigo-700", dot: "bg-indigo-500" },
      icon: Cloud,
      iconBg: "bg-indigo-50 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white",
      iconText: "text-indigo-700",
      progressBarColor: "bg-indigo-500",
      description: "Penataan hidangan estetis (food plating), pemeriksaan suhu saji pesanan, dan manajemen perputaran stok bahan baku metode FIFO.",
      verifiedJp: 58,
      targetJp: 198,
      percentage: 29,
      skills: ["Plating Estetis", "Garnish Tools", "Rotasi FIFO", "Chiller/Freezer"],
    },
  ],
  FARMASI: [
    {
      id: "far-resep",
      title: "Pelayanan Resep & Peracikan Obat",
      code: "Q.86FAR01.001.1",
      badgeLevel: "Mahir (Ready)",
      badgeColor: { bg: "bg-emerald-50", border: "border-emerald-200/80", text: "text-emerald-700", dot: "bg-emerald-500" },
      icon: Pill,
      iconBg: "bg-emerald-50 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white",
      iconText: "text-emerald-700",
      progressBarColor: "bg-emerald-500",
      description: "Skrining administratif resep dokter, perhitungan dosis obat, peracikan sediaan serbuk terbagi (puyer) dan salep non-steril.",
      verifiedJp: 114,
      targetJp: 198,
      percentage: 58,
      skills: ["Mortir & Stamper", "Timbangan Miligram", "Salep", "Puyer", "Dosis Obat"],
    },
    {
      id: "far-pio",
      title: "Pelayanan Informasi Obat (PIO) & Etiket",
      code: "Q.86FAR01.002.1",
      badgeLevel: "Menengah-Lanjut",
      badgeColor: { bg: "bg-sky-50", border: "border-sky-200/80", text: "text-sky-700", dot: "bg-sky-500" },
      icon: CheckCircle,
      iconBg: "bg-sky-50 border-sky-100 group-hover:bg-sky-600 group-hover:text-white",
      iconText: "text-sky-700",
      progressBarColor: "bg-sky-500",
      description: "Penulisan etiket obat putih/biru dan penyerahan obat disertai konseling informasi aturan pakai dan cara penyimpanan obat.",
      verifiedJp: 96,
      targetJp: 198,
      percentage: 48,
      skills: ["Etiket Obat", "Konseling PIO", "Aturan Pakai", "Buku Catatan Resep"],
    },
    {
      id: "far-stok",
      title: "Pengelolaan Perbekalan Farmasi (FEFO)",
      code: "Q.86FAR01.010.1",
      badgeLevel: "Menengah",
      badgeColor: { bg: "bg-amber-50", border: "border-amber-200/80", text: "text-amber-800", dot: "bg-amber-500" },
      icon: FlaskConical,
      iconBg: "bg-amber-50 border-amber-100 group-hover:bg-amber-600 group-hover:text-white",
      iconText: "text-amber-700",
      progressBarColor: "bg-amber-500",
      description: "Pemeriksaan tanggal kedaluwarsa dengan sistem FEFO, pencatatan kartu stok obat, dan pengelolaan penerimaan dari PBF.",
      verifiedJp: 76,
      targetJp: 198,
      percentage: 38,
      skills: ["Kartu Stok Obat", "Metode FEFO", "PBF", "Software POS Apotek"],
    },
    {
      id: "far-otc",
      title: "Administrasi Resep & Pelayanan OTC",
      code: "Q.86FAR01.020.1",
      badgeLevel: "Dasar-Menengah",
      badgeColor: { bg: "bg-indigo-50", border: "border-indigo-200/80", text: "text-indigo-700", dot: "bg-indigo-500" },
      icon: FileText,
      iconBg: "bg-indigo-50 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white",
      iconText: "text-indigo-700",
      progressBarColor: "bg-indigo-500",
      description: "Pengarsipan ordner resep masuk harian, penataan etalase apotek (planogram), dan pelayanan swamedikasi obat bebas/terbatas.",
      verifiedJp: 62,
      targetJp: 198,
      percentage: 31,
      skills: ["Ordner Resep", "Obat Bebas (OTC)", "Swamedikasi", "Display Etalase"],
    },
  ],
  RPL: MODULES,
};

function resolveSector(departmentName?: string, sectorCode?: string): string {
  if (sectorCode) {
    const s = sectorCode.toUpperCase();
    if (s === "TKR") return "OTOMOTIF";
    if (MODULES_BY_SECTOR[s]) return s;
  }
  if (departmentName) {
    const d = departmentName.toLowerCase();
    if (d.includes("akuntansi") || d.includes("akl") || d.includes("keuangan")) return "AKL";
    if (d.includes("otomotif") || d.includes("tkr") || d.includes("kendaraan")) return "OTOMOTIF";
    if (d.includes("desain") || d.includes("dkv") || d.includes("visual")) return "DKV";
    if (d.includes("kuliner") || d.includes("boga") || d.includes("restoran")) return "KULINER";
    if (d.includes("farmasi") || d.includes("apotek") || d.includes("obat")) return "FARMASI";
  }
  return "RPL";
}

import type { KanbanTask } from "./types";

interface SkkniMatrixViewProps {
  tasks?: KanbanTask[];
  departmentName?: string;
  sectorCode?: string;
}

export function SkkniMatrixView({ tasks, departmentName, sectorCode }: SkkniMatrixViewProps) {
  const [matrixLayout, setMatrixLayout] = useState<"GRID" | "LIST">("GRID");
  const [levelFilter, setLevelFilter] = useState<"ALL" | "READY" | "PROGRESS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  // Ambil modul standar yang relevan sesuai jurusan aktif siswa
  const activeModules = useMemo(() => {
    const sector = resolveSector(departmentName, sectorCode);
    return MODULES_BY_SECTOR[sector] || MODULES_BY_SECTOR["RPL"] || [];
  }, [departmentName, sectorCode]);

  // Hitung akumulasi JP dinamis per modul SKKNI dari logbook yang berstatus verified
  const dynamicModules = useMemo(() => {
    if (!tasks || tasks.length === 0) return activeModules;

    const verifiedTasks = tasks.filter((t) => t.status === "verified");

    return activeModules.map((mod) => {
      const matchingJp = verifiedTasks
        .filter((t) => {
          const modWords = mod.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
          const categoryMatch = modWords.some((w) => t.category.toLowerCase().includes(w));
          const skkniMatch = mod.code && t.skkniUnitCode && t.skkniUnitCode.includes(mod.code.slice(0, 10));
          const titleMatch = modWords.some((w) => t.title.toLowerCase().includes(w));
          return categoryMatch || skkniMatch || titleMatch;
        })
        .reduce((sum, t) => sum + t.durationJp, 0);

      const totalVerified = matchingJp > 0 ? matchingJp : mod.verifiedJp;
      const percentage = Math.min(100, Math.round((totalVerified / mod.targetJp) * 100));
      const badgeLevel = percentage >= 50 ? "Mahir (Ready)" : "Menengah";

      return {
        ...mod,
        verifiedJp: totalVerified,
        percentage,
        badgeLevel,
      };
    });
  }, [tasks, activeModules]);

  const readyCount = useMemo(() => dynamicModules.filter((m) => m.percentage >= 50).length, [dynamicModules]);
  const progressCount = useMemo(() => dynamicModules.filter((m) => m.percentage < 50).length, [dynamicModules]);

  // Filtered Modules
  const filteredModules = useMemo(() => {
    return dynamicModules.filter((m) => {
      // 1. Level Filter
      if (levelFilter === "READY" && m.percentage < 50) return false;
      if (levelFilter === "PROGRESS" && m.percentage >= 50) return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesCode = m.code.toLowerCase().includes(q);
        const matchesDesc = m.description.toLowerCase().includes(q);
        const matchesSkills = m.skills.some((s) => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCode && !matchesDesc && !matchesSkills) {
          return false;
        }
      }

      return true;
    });
  }, [dynamicModules, levelFilter, searchQuery]);

  return (
    <div className="space-y-4 pt-1 pb-6 animate-in fade-in duration-200">
      {/* ─── Control Bar: Level chips (sekunder) | Cari & List/Grid ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Status chips segmented control — gaya Apple Segmented pill */}
        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200/70 text-xs font-semibold overflow-x-auto scrollbar-none w-full sm:w-auto">
          {(
            [
              { key: "ALL", label: "Semua", count: activeModules.length },
              { key: "READY", label: "Mahir", count: readyCount },
              { key: "PROGRESS", label: "Progres", count: progressCount },
            ] as const
          ).map((chip) => {
            const active = levelFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setLevelFilter(chip.key)}
                aria-pressed={active}
                className={cn(
                  "flex-1 sm:flex-initial justify-center h-7 sm:h-7.5 px-3 rounded-full text-xs transition-all duration-150 cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                  active
                    ? chip.key === "ALL"
                      ? "bg-sky-500 text-white shadow-xs font-bold"
                      : chip.key === "READY"
                        ? "bg-white text-emerald-800 shadow-2xs font-bold"
                        : "bg-white text-amber-800 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium"
                )}
              >
                <span>{chip.label}</span>
                <span
                  className={cn(
                    "tabular-nums text-[10.5px] px-1.5 py-0.2 rounded-full font-semibold",
                    active
                      ? chip.key === "ALL"
                        ? "text-sky-100 font-bold"
                        : chip.key === "READY"
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-amber-50 text-amber-800"
                      : "text-slate-400 font-medium"
                  )}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar + View Mode Switcher (List vs Grid) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Pill Search Input */}
          <div className="relative flex-1 sm:w-60 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari modul, SKKNI, tools..."
              className="w-full h-8 pl-9 pr-8 rounded-full bg-white border border-slate-200/90 text-xs text-slate-900 placeholder:text-slate-400 font-normal focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Switcher: LIST vs GRID Toggle */}
          <div className="flex items-center bg-slate-200/60 p-0.5 rounded-full border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setMatrixLayout("LIST")}
              aria-label="Tampilan Baris Rapi (List View)"
              title="Tampilan Baris Rapi (List)"
              className={cn(
                "p-1.5 rounded-full transition-all cursor-pointer",
                matrixLayout === "LIST"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMatrixLayout("GRID")}
              aria-label="Tampilan Kartu (Grid View)"
              title="Tampilan Kartu Visual (Grid)"
              className={cn(
                "p-1.5 rounded-full transition-all cursor-pointer",
                matrixLayout === "GRID"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Empty Search State ─── */}
      {filteredModules.length === 0 && (
        <div className="py-12 bg-white rounded-3xl border border-slate-200/80 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Unit Kompetensi Tidak Ditemukan</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tidak ada modul yang cocok dengan kata kunci &quot;{searchQuery}&quot;. Coba cari istilah lain atau reset filter.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setLevelFilter("ALL");
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            Reset Pencarian
          </button>
        </div>
      )}

      {/* ─── Mode 1: GRID VIEW (Notion Minimalist Bento Cards) ─── */}
      {matrixLayout === "GRID" && filteredModules.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 animate-in fade-in duration-150">
          {filteredModules.map((module) => {
            const Icon = module.icon;
            const isExpanded = expandedModuleId === module.id;
            return (
              <div
                key={module.id}
                className={cn(
                  "bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden relative shadow-2xs group active:scale-[0.99]",
                  isExpanded
                    ? "border-slate-300 shadow-xs"
                    : "border-slate-200/70 hover:border-slate-300 hover:shadow-xs"
                )}
              >
                {/* Header: Icon, Title, SKKNI Code & Level Badge */}
                <div className="p-4 sm:p-5 pb-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl border flex items-center justify-center font-bold shadow-2xs transition-all duration-200 shrink-0",
                          module.iconBg,
                          module.iconText
                        )}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[13.5px] sm:text-sm font-semibold text-slate-900 group-hover:text-sky-600 transition-colors tracking-tight leading-snug">
                          {module.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 font-semibold text-[10px] text-slate-700 font-mono">
                            {module.code}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium shrink-0 border",
                        module.badgeColor.bg,
                        module.badgeColor.border,
                        module.badgeColor.text
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", module.badgeColor.dot)} />
                      <span>{module.badgeLevel}</span>
                    </span>
                  </div>

                  {/* Notion Skills Tag Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {module.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/60 text-[10.5px] text-slate-600 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {module.skills.length > 4 && (
                      <span className="text-[10px] text-slate-400 font-medium self-center">
                        +{module.skills.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Progress Row */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-medium text-slate-500">
                        Progres Capaian
                      </span>
                      <div className="flex items-baseline gap-1 font-sans tabular-nums">
                        <span className="font-bold text-slate-900 text-xs font-mono">
                          {module.verifiedJp}
                        </span>
                        <span className="text-slate-400 text-[11px] font-normal">
                          / {module.targetJp} JP
                        </span>
                        <span className="text-xs font-bold text-sky-600 ml-1">
                          ({module.percentage}%)
                        </span>
                      </div>
                    </div>

                    {/* Sleek Progress Bar (Solid, Flat & Modern) */}
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          module.progressBarColor
                        )}
                        style={{ width: `${module.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer: Clean Expandable Syllabus (Full-Bleed Divider) */}
                <div className="border-t border-slate-100 bg-slate-50/40 p-4 sm:p-5 py-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 font-normal">
                      Standar Kompetensi Kerja (SKKNI)
                    </span>

                    <button
                      type="button"
                      onClick={() => setExpandedModuleId(isExpanded ? null : module.id)}
                      className="text-[11px] text-slate-500 hover:text-sky-600 font-semibold inline-flex items-center gap-1 shrink-0 transition cursor-pointer"
                    >
                      <span>{isExpanded ? "Tutup Silabus" : "Rincian Silabus"}</span>
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 transition-transform duration-200",
                          isExpanded && "rotate-180 text-sky-600"
                        )}
                      />
                    </button>
                  </div>

                  {/* Expandable Clean Syllabus Description */}
                  {isExpanded && (
                    <div className="pt-2 animate-in fade-in duration-200 text-xs text-slate-600 leading-relaxed font-normal bg-white p-3 rounded-xl border border-slate-200/80">
                      <p className="font-semibold text-slate-800 mb-1">Deskripsi Silabus SKKNI:</p>
                      <p>{module.description}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Mode 2: LIST VIEW (Clean, high-density rows) ─── */}
      {matrixLayout === "LIST" && filteredModules.length > 0 && (
        <div className="space-y-2.5 animate-in fade-in duration-150">
          {filteredModules.map((module) => {
            const Icon = module.icon;
            const isExpanded = expandedModuleId === module.id;
            return (
              <div
                key={module.id}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 shadow-xs hover:border-slate-300 transition-all flex flex-col group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                  {/* Left: Icon + Title & SKKNI Code */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl border flex items-center justify-center font-bold shadow-2xs transition-all shrink-0",
                        module.iconBg,
                        module.iconText
                      )}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
                          {module.title}
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                          {module.code}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {module.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 text-[10.5px] font-normal"
                          >
                            {skill}
                          </span>
                        ))}
                        {module.skills.length > 3 && (
                          <span className="text-[10.5px] text-slate-400 font-normal">
                            +{module.skills.length - 3} lainnya
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics + Progress Bar + Status Badge */}
                  <div className="flex items-center justify-between lg:justify-end gap-3.5 shrink-0 pt-2.5 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Progress & Numbers */}
                    <div className="space-y-1 min-w-[130px] sm:min-w-[150px]">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="font-semibold text-slate-900 tabular-nums text-xs">
                          {module.verifiedJp} / {module.targetJp} JP
                        </span>
                        <span className="text-xs font-bold text-sky-600">
                          {module.percentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            module.progressBarColor
                          )}
                          style={{ width: `${module.percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Level Badge */}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 border",
                        module.badgeColor.bg,
                        module.badgeColor.border,
                        module.badgeColor.text
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", module.badgeColor.dot)} />
                      <span className="hidden sm:inline">{module.badgeLevel}</span>
                      <span className="sm:hidden">{module.percentage >= 50 ? "Mahir" : "Progres"}</span>
                    </span>

                    {/* Expand Detail Button */}
                    <button
                      type="button"
                      onClick={() => setExpandedModuleId(isExpanded ? null : module.id)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      title="Lihat detail silabus"
                    >
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Syllabus Description in List */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 animate-in fade-in duration-200 text-xs text-slate-600 leading-relaxed font-normal bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
                    <p className="font-semibold text-slate-800 mb-1">Cakupan Unit Pembelajaran SKKNI:</p>
                    <p>{module.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SkkniMatrixView;

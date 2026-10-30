"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  BookOpen,
  Search,
  CheckCircle2,
  Sparkles,
  Layers,
  Wrench,
  AlertCircle,
  FileCheck2,
  ChevronDown,
  GraduationCap,
} from "lucide-react";
import { addJobCard, fetchCurriculum } from "@/lib/api";
import { cn } from "@/lib/cn";

export interface JobCardDisplayItem {
  id: string;
  title: string;
  cpElementId?: string | null;
  cpCode?: string;
  cpTitle?: string;
  skkniUnitCode?: string | null;
  toolsAndSoftware?: string[];
  actionVerbTemplate?: string;
  isNonCompetency?: boolean;
  isCustom?: boolean;
}

interface TeacherJobCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  schoolId: string;
  departmentName?: string;
  sectorCode?: string;
  cpElements?: Array<{ id: string; code: string; title: string; targetJp: number }>;
  token?: string;
  onJobCardCreated?: (newCard: JobCardDisplayItem) => void;
}

// Fallback seed data untuk 6 jurusan SMK resmi (Fase F Kurikulum Merdeka)
const DEFAULT_FALLBACK_JOB_CARDS_BY_SECTOR: Record<string, JobCardDisplayItem[]> = {
  AKL: [
    {
      id: "seed-akl-1",
      title: "Pencatatan transaksi jurnal harian",
      cpCode: "AKL-CP-01",
      cpTitle: "Akuntansi Keuangan — Siklus Transaksi dan Jurnal",
      skkniUnitCode: "M.692000.003.02",
      toolsAndSoftware: ["Microsoft Excel", "MYOB", "Accurate"],
      actionVerbTemplate: "Mencatat transaksi kas, bank, dan jurnal harian menggunakan [software]",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-akl-2",
      title: "Input data faktur dan bukti kas",
      cpCode: "AKL-CP-01",
      cpTitle: "Akuntansi Keuangan — Siklus Transaksi dan Jurnal",
      skkniUnitCode: "M.692000.004.02",
      toolsAndSoftware: ["Microsoft Excel", "Accurate"],
      actionVerbTemplate: "Menginput data faktur pembelian/penjualan dan bukti kas masuk/keluar",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-akl-3",
      title: "Penyusunan laporan keuangan",
      cpCode: "AKL-CP-02",
      cpTitle: "Laporan Keuangan — Penyusunan dan Analisis",
      skkniUnitCode: "M.692000.008.02",
      toolsAndSoftware: ["Microsoft Excel", "MYOB"],
      actionVerbTemplate: "Menyusun laporan laba rugi, neraca, dan perubahan ekuitas periode [periode]",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-akl-4",
      title: "Rekonsiliasi laporan bank",
      cpCode: "AKL-CP-02",
      cpTitle: "Laporan Keuangan — Penyusunan dan Analisis",
      skkniUnitCode: "M.692000.005.02",
      toolsAndSoftware: ["Microsoft Excel"],
      actionVerbTemplate: "Merekonsiliasi catatan kas perusahaan dengan rekening koran bank",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-akl-5",
      title: "Perhitungan dan pelaporan perpajakan",
      cpCode: "AKL-CP-03",
      cpTitle: "Perpajakan — Administrasi dan Pelaporan",
      skkniUnitCode: "M.692000.016.02",
      toolsAndSoftware: ["e-Filing DJP", "e-Faktur DJP", "Microsoft Excel"],
      actionVerbTemplate: "Menghitung dan melaporkan kewajiban pajak (PPh/PPN) periode [bulan]",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-akl-6",
      title: "Pengarsipan dokumen keuangan",
      cpCode: "AKL-CP-04",
      cpTitle: "Administrasi Keuangan dan Kas",
      skkniUnitCode: "M.692000.020.02",
      toolsAndSoftware: ["Filing System", "Scanner", "Microsoft Office"],
      actionVerbTemplate: "Mengarsipkan faktur, bukti transaksi, dan voucher keuangan secara terstruktur",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-akl-7",
      title: "Pengelolaan kas kecil dan pembayaran vendor",
      cpCode: "AKL-CP-04",
      cpTitle: "Administrasi Keuangan dan Kas",
      skkniUnitCode: "M.692000.021.02",
      toolsAndSoftware: ["Microsoft Excel", "Internet Banking"],
      actionVerbTemplate: "Mengelola transaksi kas kecil (petty cash) dan verifikasi tagihan vendor",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-akl-8",
      title: "Pencatatan persediaan dan opname stok",
      cpCode: "AKL-CP-05",
      cpTitle: "Akuntansi Biaya dan Persediaan",
      skkniUnitCode: "M.692000.026.02",
      toolsAndSoftware: ["Microsoft Excel", "Barcode Scanner"],
      actionVerbTemplate: "Memperbarui kartu stok barang dan melakukan opname stok fisik berkala",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-akl-nc",
      title: "Tugas Operasional Umum (Non-Jurusan)",
      cpCode: "NON-CP",
      cpTitle: "Bantuan Operasional Kantor / DUDI",
      skkniUnitCode: null,
      toolsAndSoftware: ["Printer", "Scanner", "Alat Tulis Kantor"],
      actionVerbTemplate: "Melaksanakan tugas operasional pendukung kantor selama {duration} JP",
      isNonCompetency: true,
      isCustom: false,
    },
  ],
  OTOMOTIF: [
    {
      id: "seed-oto-1",
      title: "Servis berkala dan perawatan rutin",
      cpCode: "OTO-CP-01",
      cpTitle: "Servis Berkala dan Perawatan Mesin",
      skkniUnitCode: "G.45OTO01.001.2",
      toolsAndSoftware: ["Lift Hidrolik", "Kunci Torsi", "Oil Drain"],
      actionVerbTemplate: "Melakukan servis berkala kendaraan (penggantian pelumas, filter, dan inspeksi rutin)",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-oto-2",
      title: "Perbaikan mesin dan transmisi",
      cpCode: "OTO-CP-01",
      cpTitle: "Servis Berkala dan Perawatan Mesin",
      skkniUnitCode: "G.45OTO01.004.2",
      toolsAndSoftware: ["Kunci Spesial", "Mikrometer", "Dial Gauge"],
      actionVerbTemplate: "Melakukan perawatan dan perbaikan komponen mesin sesuai standar pabrik",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-oto-3",
      title: "Perbaikan sistem rem dan kemudi",
      cpCode: "OTO-CP-02",
      cpTitle: "Sistem Rem, Suspensi dan Kelistrikan",
      skkniUnitCode: "G.45OTO01.010.2",
      toolsAndSoftware: ["Kunci Roda", "Dial Gauge", "Brake Bleeder"],
      actionVerbTemplate: "Melakukan pemeriksaan, pembongkaran, dan penyetelan sistem rem kendaraan",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-oto-4",
      title: "Diagnosa kelistrikan kendaraan",
      cpCode: "OTO-CP-02",
      cpTitle: "Sistem Rem, Suspensi dan Kelistrikan",
      skkniUnitCode: "G.45OTO01.012.2",
      toolsAndSoftware: ["Scan Tool OBD-II", "Multimeter Digital", "Wiring Diagram"],
      actionVerbTemplate: "Mendiagnosis gangguan kelistrikan bodi dan mesin menggunakan alat diagnostik",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-oto-5",
      title: "Servis transmisi, kopling, dan penggerak roda",
      cpCode: "OTO-CP-03",
      cpTitle: "Sistem Transmisi dan Penggerak",
      skkniUnitCode: "G.45OTO01.015.2",
      toolsAndSoftware: ["Kunci Torsi", "Special Tool Transmisi", "Lift"],
      actionVerbTemplate: "Melakukan pemeriksaan dan servis unit kopling serta sistem pemindah daya",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-oto-6",
      title: "Pengecatan dan perbaikan bodi",
      cpCode: "OTO-CP-04",
      cpTitle: "Bodi dan Perbaikan Kendaraan",
      skkniUnitCode: "G.45OTO01.020.2",
      toolsAndSoftware: ["Spray Gun", "Sander", "Body Puller"],
      actionVerbTemplate: "Melakukan perbaikan bodi panel kendaraan dan proses pengecatan dasar/finishing",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-oto-7",
      title: "Pemeriksaan AC dan sistem modern",
      cpCode: "OTO-CP-04",
      cpTitle: "Bodi dan Perbaikan Kendaraan",
      skkniUnitCode: "G.45OTO01.021.2",
      toolsAndSoftware: ["Manifold Gauge", "Leak Detector", "Scan Tool"],
      actionVerbTemplate: "Memeriksa tekanan refrigeran AC mobil dan uji fungsi sistem pendingin kabin",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-oto-nc",
      title: "Tugas Operasional Umum Bengkel (Non-Jurusan)",
      cpCode: "NON-CP",
      cpTitle: "Bantuan Operasional Bengkel / DUDI",
      skkniUnitCode: null,
      toolsAndSoftware: ["Peralatan Bengkel", "Kain Majun", "Caddy Tools"],
      actionVerbTemplate: "Melaksanakan tugas operasional pendukung bengkel selama {duration} JP",
      isNonCompetency: true,
      isCustom: false,
    },
  ],
  DKV: [
    {
      id: "seed-dkv-1",
      title: "Perancangan identitas visual dan logo",
      cpCode: "DKV-CP-01",
      cpTitle: "Desain Grafis dan Branding",
      skkniUnitCode: "M.74100.001.01",
      toolsAndSoftware: ["Adobe Illustrator", "CorelDRAW"],
      actionVerbTemplate: "Merancang aset visual logo dan identitas merek [nama klien]",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-dkv-2",
      title: "Pembuatan konten media sosial dan promosi",
      cpCode: "DKV-CP-01",
      cpTitle: "Desain Grafis dan Branding",
      skkniUnitCode: "M.74100.002.01",
      toolsAndSoftware: ["Adobe Photoshop", "Canva"],
      actionVerbTemplate: "Membuat materi promosi visual dan konten media sosial berkala",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-dkv-3",
      title: "Ilustrasi digital dan desain karakter",
      cpCode: "DKV-CP-02",
      cpTitle: "Ilustrasi dan Aset Digital",
      skkniUnitCode: "M.74100.005.01",
      toolsAndSoftware: ["Clip Studio Paint", "Procreate", "Pen Tablet"],
      actionVerbTemplate: "Menggambar ilustrasi digital untuk kebutuhan materi publikasi",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-dkv-4",
      title: "Layouting dan tata letak media cetak/digital",
      cpCode: "DKV-CP-03",
      cpTitle: "Tata Letak dan Tipografi",
      skkniUnitCode: "M.74100.008.01",
      toolsAndSoftware: ["Adobe InDesign", "Illustrator"],
      actionVerbTemplate: "Menyusun tata letak buku, majalah, katalog, atau brosur cetak",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-dkv-5",
      title: "Editing video dan motion graphics",
      cpCode: "DKV-CP-04",
      cpTitle: "Media Bergerak dan Fotografi",
      skkniUnitCode: "M.74100.011.01",
      toolsAndSoftware: ["Adobe Premiere Pro", "After Effects", "CapCut"],
      actionVerbTemplate: "Mengedit video promosi dan motion graphics bumper tayangan",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-dkv-6",
      title: "Fotografi produk dan dokumentasi visual",
      cpCode: "DKV-CP-04",
      cpTitle: "Media Bergerak dan Fotografi",
      skkniUnitCode: "M.74100.012.01",
      toolsAndSoftware: ["Kamera DSLR/Mirrorless", "Lighting Studio"],
      actionVerbTemplate: "Melakukan pemotretan produk studio dan retouching foto",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-dkv-nc",
      title: "Tugas Operasional Studio (Non-Jurusan)",
      cpCode: "NON-CP",
      cpTitle: "Bantuan Operasional Studio / DUDI",
      skkniUnitCode: null,
      toolsAndSoftware: ["Peralatan Kantor", "Arsip Fisik"],
      actionVerbTemplate: "Melaksanakan tugas operasional umum studio kreatif selama {duration} JP",
      isNonCompetency: true,
      isCustom: false,
    },
  ],
  KULINER: [
    {
      id: "seed-kul-1",
      title: "Persiapan bahan dan mise en place",
      cpCode: "KUL-CP-01",
      cpTitle: "Sanitasi, Hygiene, dan Penanganan Bahan",
      skkniUnitCode: "I.55HDR00.001.2",
      toolsAndSoftware: ["Pisau Dapur", "Cutting Board", "Timbangan"],
      actionVerbTemplate: "Menyiapkan dan menimbang bahan mentah sesuai standar resep (mise en place)",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-kul-2",
      title: "Sanitasi, hygiene, dan pembersihan dapur",
      cpCode: "KUL-CP-01",
      cpTitle: "Sanitasi, Hygiene, dan Penanganan Bahan",
      skkniUnitCode: "I.55HDR00.002.2",
      toolsAndSoftware: ["Sanitizer", "Peralatan Kebersihan"],
      actionVerbTemplate: "Melaksanakan prosedur kebersihan dan sanitasi area kerja dapur",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-kul-3",
      title: "Pengolahan hidangan utama (hot kitchen)",
      cpCode: "KUL-CP-02",
      cpTitle: "Pengolahan Hidangan Utama",
      skkniUnitCode: "I.55HDR00.010.2",
      toolsAndSoftware: ["Kompor Industri", "Wok", "Oven"],
      actionVerbTemplate: "Memasak hidangan utama oriental/kontinental/nusantara sesuai SOP",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-kul-4",
      title: "Pembuatan pastry, bakery, dan dessert",
      cpCode: "KUL-CP-03",
      cpTitle: "Pastry, Bakery, dan Dessert",
      skkniUnitCode: "I.55HDR00.015.2",
      toolsAndSoftware: ["Mixer Planetary", "Deck Oven", "Loyang"],
      actionVerbTemplate: "Membuat adonan roti, pastry, atau cake penutup sesuai formulasi",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-kul-5",
      title: "Penataan hidangan (plating) dan penyajian",
      cpCode: "KUL-CP-04",
      cpTitle: "Pelayanan Restoran dan Plating",
      skkniUnitCode: "I.55HDR00.020.2",
      toolsAndSoftware: ["Peralatan Saji", "Garnish Tools"],
      actionVerbTemplate: "Menata plating hidangan estetis dan memeriksa suhu saji pesanan",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-kul-6",
      title: "Pengelolaan stok bahan baku dan inventory",
      cpCode: "KUL-CP-04",
      cpTitle: "Pelayanan Restoran dan Plating",
      skkniUnitCode: "I.55HDR00.022.2",
      toolsAndSoftware: ["Kartu Stok", "Chiller / Freezer"],
      actionVerbTemplate: "Memeriksa penerimaan bahan basah/kering dan rotasi stok FIFO",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-kul-nc",
      title: "Tugas Operasional Restoran (Non-Jurusan)",
      cpCode: "NON-CP",
      cpTitle: "Bantuan Operasional Restoran / DUDI",
      skkniUnitCode: null,
      toolsAndSoftware: ["Peralatan Restoran"],
      actionVerbTemplate: "Melaksanakan tugas operasional umum restoran selama {duration} JP",
      isNonCompetency: true,
      isCustom: false,
    },
  ],
  FARMASI: [
    {
      id: "seed-far-1",
      title: "Peracikan obat non-steril sesuai resep",
      cpCode: "FAR-CP-01",
      cpTitle: "Pelayanan Resep dan Peracikan",
      skkniUnitCode: "Q.86FAR01.001.1",
      toolsAndSoftware: ["Mortir dan Stamper", "Timbangan Miligram"],
      actionVerbTemplate: "Meracik sediaan puyer/kapsul/salep sesuai salinan resep dokter",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-far-2",
      title: "Pelayanan resep dan penyerahan obat (PIO)",
      cpCode: "FAR-CP-01",
      cpTitle: "Pelayanan Resep dan Peracikan",
      skkniUnitCode: "Q.86FAR01.002.1",
      toolsAndSoftware: ["Etiket Obat", "Buku Catatan Pelayanan"],
      actionVerbTemplate: "Menyiapkan etiket dan menyerahkan obat disertai informasi aturan pakai",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-far-3",
      title: "Pengelolaan perbekalan farmasi dan stok obat",
      cpCode: "FAR-CP-02",
      cpTitle: "Pengelolaan Perbekalan Farmasi",
      skkniUnitCode: "Q.86FAR01.010.1",
      toolsAndSoftware: ["Kartu Stok Obat", "Software POS Apotek"],
      actionVerbTemplate: "Mengecek masa kadaluarsa (FEFO) dan mencatat mutasi stok perbekalan farmasi",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-far-4",
      title: "Pencatatan dan pengarsipan resep harian",
      cpCode: "FAR-CP-03",
      cpTitle: "Administrasi dan Pengarsipan Farmasi",
      skkniUnitCode: "Q.86FAR01.015.1",
      toolsAndSoftware: ["Ordner Resep", "Microsoft Excel"],
      actionVerbTemplate: "Mendokumentasikan dan menyortir resep masuk harian apotek",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-far-5",
      title: "Pelayanan swamedikasi dan produk OTC",
      cpCode: "FAR-CP-04",
      cpTitle: "Swamedikasi dan Produk OTC",
      skkniUnitCode: "Q.86FAR01.020.1",
      toolsAndSoftware: ["Planogram Display", "Brosur Informasi Obat"],
      actionVerbTemplate: "Melayani permintaan obat bebas/bebas terbatas (OTC) pelanggan",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-far-nc",
      title: "Tugas Operasional Apotek (Non-Jurusan)",
      cpCode: "NON-CP",
      cpTitle: "Bantuan Operasional Apotek / DUDI",
      skkniUnitCode: null,
      toolsAndSoftware: ["Komputer", "Printer"],
      actionVerbTemplate: "Melaksanakan tugas operasional umum apotek/klinik selama {duration} JP",
      isNonCompetency: true,
      isCustom: false,
    },
  ],
  RPL: [
    {
      id: "seed-rpl-1",
      title: "Membuat komponen UI dengan HTML dan CSS",
      cpCode: "RPL-CP-01",
      cpTitle: "Pemrograman Dasar dan Pengembangan Web Frontend",
      skkniUnitCode: "J.620100.020.02",
      toolsAndSoftware: ["VS Code", "Chrome DevTools", "Figma"],
      actionVerbTemplate: "Membuat komponen antarmuka web responsif menggunakan HTML/CSS",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-rpl-2",
      title: "Mengimplementasikan logika dan fungsi pemrograman",
      cpCode: "RPL-CP-01",
      cpTitle: "Pemrograman Dasar dan Pengembangan Web Frontend",
      skkniUnitCode: "J.620100.021.02",
      toolsAndSoftware: ["VS Code", "Node.js", "Chrome DevTools"],
      actionVerbTemplate: "Mengimplementasikan logika aplikasi dan manipulasi data menggunakan JavaScript/TypeScript",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-rpl-3",
      title: "Membuat dan integrasi endpoint API",
      cpCode: "RPL-CP-02",
      cpTitle: "Backend dan Integrasi Sistem",
      skkniUnitCode: "J.620100.022.02",
      toolsAndSoftware: ["VS Code", "Postman", "Express / Node.js"],
      actionVerbTemplate: "Membuat dan mengintegrasikan REST API untuk modul fitur aplikasi",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-rpl-4",
      title: "Perancangan dan pengelolaan basis data",
      cpCode: "RPL-CP-03",
      cpTitle: "Basis Data dan Penyimpanan Data",
      skkniUnitCode: "J.620100.025.02",
      toolsAndSoftware: ["PostgreSQL", "DBeaver", "Prisma"],
      actionVerbTemplate: "Merancang skema tabel dan mengeksekusi query database aplikasi",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-rpl-5",
      title: "Menulis unit test dan pengujian software",
      cpCode: "RPL-CP-04",
      cpTitle: "Pengujian dan Deployment Software",
      skkniUnitCode: "J.620100.028.02",
      toolsAndSoftware: ["Vitest", "Jest", "Postman"],
      actionVerbTemplate: "Menulis dan menjalankan unit test serta pengujian alur fungsional",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-rpl-6",
      title: "Debugging dan deployment aplikasi",
      cpCode: "RPL-CP-04",
      cpTitle: "Pengujian dan Deployment Software",
      skkniUnitCode: "J.620100.030.02",
      toolsAndSoftware: ["Git", "GitHub", "Vercel / Cloudflare"],
      actionVerbTemplate: "Memperbaiki bug aplikasi dan melakukan deployment ke server lingkungan pengujian",
      isNonCompetency: false,
      isCustom: false,
    },
    {
      id: "seed-rpl-nc",
      title: "Tugas Operasional Kantor IT (Non-Jurusan)",
      cpCode: "NON-CP",
      cpTitle: "Bantuan Operasional Kantor / DUDI",
      skkniUnitCode: null,
      toolsAndSoftware: ["Komputer", "Printer", "Dokumentasi"],
      actionVerbTemplate: "Melaksanakan tugas operasional pendukung kantor IT selama {duration} JP",
      isNonCompetency: true,
      isCustom: false,
    },
  ],
};

function getFallbackCardsBySector(sectorCode?: string): JobCardDisplayItem[] {
  const rplCards = DEFAULT_FALLBACK_JOB_CARDS_BY_SECTOR["RPL"] || [];
  if (!sectorCode) return rplCards;
  const upper = sectorCode.toUpperCase();
  if (upper === "TKR") return DEFAULT_FALLBACK_JOB_CARDS_BY_SECTOR["OTOMOTIF"] || rplCards;
  return DEFAULT_FALLBACK_JOB_CARDS_BY_SECTOR[upper] || rplCards;
}

interface SectorGuide {
  titleExample: string;
  skkniExample: string;
  toolsExample: string;
  narrationExample: string;
  suggestedTools: string[];
  skkniByCpCode: Record<string, { code: string; label: string }[]>;
}

const SECTOR_GUIDES: Record<string, SectorGuide> = {
  AKL: {
    titleExample: "Contoh: Rekonsiliasi Bank dan Pencatatan Kas Kecil",
    skkniExample: "Misal: M.692000.005.02",
    toolsExample: "Misal: Microsoft Excel, Accurate, MYOB",
    narrationExample: "Contoh: Merekonsiliasi catatan kas perusahaan dengan rekening koran bank menggunakan {tool} selama {duration} JP",
    suggestedTools: ["Microsoft Excel", "Accurate", "MYOB", "e-Faktur DJP", "e-Filing DJP", "Filing System", "Barcode Scanner"],
    skkniByCpCode: {
      "AKL-CP-01": [
        { code: "M.692000.003.02", label: "Pencatatan Transaksi Jurnal Harian" },
        { code: "M.692000.004.02", label: "Input Faktur & Bukti Kas Masuk/Keluar" },
      ],
      "AKL-CP-02": [
        { code: "M.692000.008.02", label: "Penyusunan Laporan Laba Rugi & Neraca" },
        { code: "M.692000.005.02", label: "Rekonsiliasi Bank & Buku Kas" },
      ],
      "AKL-CP-03": [
        { code: "M.692000.016.02", label: "Perhitungan & Pelaporan Pajak PPh/PPN" },
      ],
      "AKL-CP-04": [
        { code: "M.692000.020.02", label: "Pengarsipan Dokumen & Voucher Keuangan" },
        { code: "M.692000.021.02", label: "Pengelolaan Kas Kecil (Petty Cash)" },
      ],
      "AKL-CP-05": [
        { code: "M.692000.026.02", label: "Pencatatan Persediaan & Opname Stok" },
      ],
    },
  },
  OTOMOTIF: {
    titleExample: "Contoh: Tune-up Mesin Bensin EFI & Servis Berkala",
    skkniExample: "Misal: G.45OTO01.001.2",
    toolsExample: "Misal: Scan Tool OBD-II, Multimeter, Kunci Torsi",
    narrationExample: "Contoh: Melakukan tune-up mesin dan servis berkala berkala menggunakan {tool} selama {duration} JP",
    suggestedTools: ["Scan Tool OBD-II", "Multimeter Digital", "Kunci Torsi", "Brake Bleeder", "Lift Hidrolik", "Manifold Gauge AC"],
    skkniByCpCode: {
      "OTO-CP-01": [
        { code: "G.45OTO01.001.2", label: "Servis Berkala & Perawatan Mesin Rutin" },
        { code: "G.45OTO01.004.2", label: "Perawatan & Perbaikan Komponen Mesin" },
      ],
      "OTO-CP-02": [
        { code: "G.45OTO01.010.2", label: "Pemeriksaan & Servis Rem serta Kemudi" },
        { code: "G.45OTO01.012.2", label: "Diagnosa Kelistrikan Bodi & Sensor ECU" },
      ],
      "OTO-CP-03": [
        { code: "G.45OTO01.015.2", label: "Servis Transmisi, Kopling, & Penggerak Roda" },
      ],
      "OTO-CP-04": [
        { code: "G.45OTO01.020.2", label: "Pengecatan & Perbaikan Bodi Panel" },
        { code: "G.45OTO01.021.2", label: "Pemeriksaan Tekanan AC Mobil & Freon" },
      ],
    },
  },
  DKV: {
    titleExample: "Contoh: Perancangan Aset Visual & Konten Promosi Medsos",
    skkniExample: "Misal: M.74100.001.01",
    toolsExample: "Misal: Adobe Illustrator, Photoshop, Figma",
    narrationExample: "Contoh: Merancang materi promosi visual dan konten media sosial menggunakan {tool} selama {duration} JP",
    suggestedTools: ["Adobe Illustrator", "Adobe Photoshop", "Figma", "Canva", "Adobe Premiere Pro", "After Effects", "InDesign"],
    skkniByCpCode: {
      "DKV-CP-01": [
        { code: "M.74100.001.01", label: "Perancangan Identitas Visual & Logo Brand" },
        { code: "M.74100.002.01", label: "Pembuatan Konten Visual Medsos & Banner" },
      ],
      "DKV-CP-02": [
        { code: "M.74100.005.01", label: "Ilustrasi Digital & Desain Karakter Maskot" },
      ],
      "DKV-CP-03": [
        { code: "M.74100.008.01", label: "Layout Majalah, Katalog, & Media Cetak" },
      ],
      "DKV-CP-04": [
        { code: "M.74100.011.01", label: "Editing Video Promosi & Motion Graphics" },
        { code: "M.74100.012.01", label: "Fotografi Produk Studio & Retouching" },
      ],
    },
  },
  KULINER: {
    titleExample: "Contoh: Pembuatan Pastry Bakery & Plating Hidangan",
    skkniExample: "Misal: I.55HDR00.001.2",
    toolsExample: "Misal: Pisau Dapur, Mixer Planetary, Deck Oven",
    narrationExample: "Contoh: Menyiapkan dan mengolah hidangan masakan menggunakan {tool} selama {duration} JP",
    suggestedTools: ["Pisau Chef", "Combi Oven", "Mixer Planetary", "Garnish Tools", "Timbangan Digital", "Chiller"],
    skkniByCpCode: {
      "KUL-CP-01": [
        { code: "I.55HDR00.001.2", label: "Persiapan Bahan Baku & Mise en Place" },
        { code: "I.55HDR00.002.2", label: "Sanitasi, Higienitas Dapur, & HACCP" },
      ],
      "KUL-CP-02": [
        { code: "I.55HDR00.010.2", label: "Pengolahan Hidangan Utama (Hot Kitchen)" },
      ],
      "KUL-CP-03": [
        { code: "I.55HDR00.015.2", label: "Pembuatan Adonan Roti, Pastry, & Cake" },
      ],
      "KUL-CP-04": [
        { code: "I.55HDR00.020.2", label: "Penataan Plating Estetis & Uji Suhu Saji" },
        { code: "I.55HDR00.022.2", label: "Pengelolaan Stok Bahan Baku FIFO" },
      ],
    },
  },
  FARMASI: {
    titleExample: "Contoh: Peracikan Salep dan Puyer Sesuai Resep Dokter",
    skkniExample: "Misal: Q.86FAR01.001.1",
    toolsExample: "Misal: Mortir & Stamper, Timbangan Miligram, POS Apotek",
    narrationExample: "Contoh: Meracik sediaan obat non-steril sesuai resep dokter menggunakan {tool} selama {duration} JP",
    suggestedTools: ["Mortir & Stamper", "Timbangan Miligram", "Etiket Obat", "POS Apotek", "Kartu Stok FEFO", "Ordner Resep"],
    skkniByCpCode: {
      "FAR-CP-01": [
        { code: "Q.86FAR01.001.1", label: "Peracikan Sediaan Obat Puyer & Salep" },
        { code: "Q.86FAR01.002.1", label: "Pelayanan Resep & Informasi Obat (PIO)" },
      ],
      "FAR-CP-02": [
        { code: "Q.86FAR01.010.1", label: "Pemeriksaan Masa Kadaluarsa FEFO & Mutasi Stok" },
      ],
      "FAR-CP-03": [
        { code: "Q.86FAR01.015.1", label: "Pengarsipan Dokumen & Resep Harian Apotek" },
      ],
      "FAR-CP-04": [
        { code: "Q.86FAR01.020.1", label: "Pelayanan Obat Bebas (OTC) & Swamedikasi" },
      ],
    },
  },
  RPL: {
    titleExample: "Contoh: Pembuatan REST API & Manajemen Database",
    skkniExample: "Misal: J.620100.020.02",
    toolsExample: "Misal: VS Code, Postman, Git, PostgreSQL",
    narrationExample: "Contoh: Mengembangkan antarmuka aplikasi web menggunakan {tool} selama {duration} JP",
    suggestedTools: ["VS Code", "Postman", "Git / GitHub", "PostgreSQL", "Chrome DevTools", "Figma"],
    skkniByCpCode: {
      "RPL-CP-01": [
        { code: "J.620100.020.02", label: "Pembuatan Komponen Antarmuka Web (UI/CSS)" },
        { code: "J.620100.021.02", label: "Implementasi Logika & Fungsi Interaktif" },
      ],
      "RPL-CP-02": [
        { code: "J.620100.022.02", label: "Pembuatan & Integrasi Endpoint API RESTful" },
      ],
      "RPL-CP-03": [
        { code: "J.620100.025.02", label: "Perancangan & Query Basis Data Relasional" },
      ],
      "RPL-CP-04": [
        { code: "J.620100.028.02", label: "Menulis Unit Testing & Verifikasi Fitur" },
        { code: "J.620100.030.02", label: "Debugging & Deployment Lingkungan Server" },
      ],
    },
  },
};

function getSectorGuide(sectorCode?: string): SectorGuide {
  const rpl = SECTOR_GUIDES["RPL"]!;
  if (!sectorCode) return rpl;
  const upper = sectorCode.toUpperCase();
  if (upper === "TKR") return SECTOR_GUIDES["OTOMOTIF"] || rpl;
  return SECTOR_GUIDES[upper] || rpl;
}

/**
 * Deteksi cerdas sektor/jurusan dari Elemen CP terpilih, daftar CP, nama jurusan, atau prop.
 * Menjamin form dan katalog selalu 100% relevan untuk semua jurusan (AKL, Otomotif, DKV, Kuliner, Farmasi, RPL).
 */
function detectSector(
  explicitSector?: string,
  deptName?: string,
  selectedCpCode?: string,
  allCps?: { code: string }[]
): string {
  // 1. Prioritaskan dari Elemen CP yang sedang dipilih
  if (selectedCpCode) {
    const prefix = selectedCpCode.split("-")[0]?.toUpperCase();
    if (prefix === "AKL") return "AKL";
    if (prefix === "OTO" || prefix === "TKR") return "OTOMOTIF";
    if (prefix === "DKV") return "DKV";
    if (prefix === "KLN" || prefix === "TBG") return "KULINER";
    if (prefix === "FRM") return "FARMASI";
    if (prefix === "RPL" || prefix === "SIJA") return "RPL";
  }

  // 2. Cek dari daftar Elemen CP yang tersedia
  if (allCps && allCps.length > 0) {
    for (const cp of allCps) {
      if (cp.code) {
        const prefix = cp.code.split("-")[0]?.toUpperCase();
        if (prefix === "AKL") return "AKL";
        if (prefix === "OTO" || prefix === "TKR") return "OTOMOTIF";
        if (prefix === "DKV") return "DKV";
        if (prefix === "KLN" || prefix === "TBG") return "KULINER";
        if (prefix === "FRM") return "FARMASI";
        if (prefix === "RPL" || prefix === "SIJA") return "RPL";
      }
    }
  }

  // 3. Cek dari nama jurusan (deptName)
  if (deptName) {
    const low = deptName.toLowerCase();
    if (low.includes("akuntansi") || low.includes("keuangan") || low.includes("akl")) return "AKL";
    if (low.includes("otomotif") || low.includes("kendaraan") || low.includes("tkr") || low.includes("tsm")) return "OTOMOTIF";
    if (low.includes("desain") || low.includes("dkv") || low.includes("multimedia") || low.includes("animasi")) return "DKV";
    if (low.includes("kuliner") || low.includes("boga") || low.includes("tata boga")) return "KULINER";
    if (low.includes("farmasi") || low.includes("obat")) return "FARMASI";
    if (low.includes("rekayasa") || low.includes("perangkat lunak") || low.includes("rpl") || low.includes("informatika")) return "RPL";
  }

  // 4. Fallback ke explicitSector jika valid
  if (explicitSector) {
    const up = explicitSector.toUpperCase();
    if (up === "TKR") return "OTOMOTIF";
    if (SECTOR_GUIDES[up]) return up;
  }

  return "RPL";
}

export function TeacherJobCardModal({
  isOpen,
  onClose,
  departmentId,
  schoolId,
  departmentName = "Rekayasa Perangkat Lunak",
  sectorCode = "RPL",
  cpElements = [],
  token = "",
  onJobCardCreated,
}: TeacherJobCardModalProps) {
  const [activeTab, setActiveTab] = useState<"catalog" | "create">("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCpFilter, setSelectedCpFilter] = useState<string>("ALL");

  // State Form Input
  const [title, setTitle] = useState("");
  const [selectedCpId, setSelectedCpId] = useState<string>("");
  const [skkniUnitCode, setSkkniUnitCode] = useState("");
  const [toolsInput, setToolsInput] = useState("");
  const [actionVerbTemplate, setActionVerbTemplate] = useState("");
  const [isNonCompetency, setIsNonCompetency] = useState(false);

  // Status submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Deteksi Elemen CP aktif yang dipilih
  const selectedCp = useMemo(
    () => cpElements.find((cp) => cp.id === selectedCpId),
    [cpElements, selectedCpId]
  );

  // Deteksi cerdas sektor/jurusan dari Elemen CP aktif, daftar CP, nama jurusan, atau prop
  const effectiveSector = useMemo(
    () => detectSector(sectorCode, departmentName, selectedCp?.code, cpElements),
    [sectorCode, departmentName, selectedCp?.code, cpElements]
  );

  // List Job Cards
  const [jobCardsList, setJobCardsList] = useState<JobCardDisplayItem[]>(() =>
    getFallbackCardsBySector(
      detectSector(sectorCode, departmentName, undefined, cpElements)
    )
  );
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // Panduan rekomendasi relevan sesuai jurusan aktif
  const sectorGuide = useMemo(() => getSectorGuide(effectiveSector), [effectiveSector]);

  // Rekomendasi unit SKKNI resmi untuk Elemen CP yang sedang dipilih
  const activeCpSuggestions = useMemo(() => {
    if (!selectedCpId || isNonCompetency) return [];
    const matchingCp = cpElements.find((cp) => cp.id === selectedCpId);
    if (!matchingCp) return [];
    return sectorGuide.skkniByCpCode[matchingCp.code] || [];
  }, [selectedCpId, cpElements, sectorGuide, isNonCompetency]);

  // Otomatis sinkronkan kode SKKNI resmi saat Elemen CP dipilih
  useEffect(() => {
    if (activeCpSuggestions.length > 0) {
      const isAlreadyInSuggestions = activeCpSuggestions.some((s) => s.code === skkniUnitCode);
      if (!skkniUnitCode || !isAlreadyInSuggestions) {
        setSkkniUnitCode(activeCpSuggestions[0]!.code);
      }
    } else if (isNonCompetency) {
      setSkkniUnitCode("");
    }
  }, [activeCpSuggestions, isNonCompetency, skkniUnitCode]);

  // Sinkronisasi fallback jika effectiveSector berganti sebelum data DB termuat
  useEffect(() => {
    setJobCardsList((prev) => {
      const hasLiveLoaded = prev.some((c) => !c.id.startsWith("seed-"));
      if (hasLiveLoaded) return prev;
      return getFallbackCardsBySector(effectiveSector);
    });
  }, [effectiveSector]);

  // Set default CP selection saat modal dibuka
  useEffect(() => {
    if (cpElements.length > 0 && !selectedCpId) {
      setSelectedCpId(cpElements[0]!.id);
    }
  }, [cpElements, selectedCpId]);

  // Load katalog riil dari database sekolah/jurusan
  useEffect(() => {
    let isCurrent = true;
    async function loadCatalog() {
      if (!isOpen || !schoolId || !departmentId || !token) return;
      setIsLoadingCatalog(true);
      try {
        const res = await fetchCurriculum(schoolId, departmentId, token);
        if (isCurrent && res && res.elements) {
          const loadedCards: JobCardDisplayItem[] = [];

          res.elements.forEach((el) => {
            el.jobCards?.forEach((jc) => {
              loadedCards.push({
                id: jc.id,
                title: jc.title,
                cpElementId: el.id,
                cpCode: el.code,
                cpTitle: el.title,
                skkniUnitCode: jc.skkniUnitCode,
                toolsAndSoftware: jc.toolsAndSoftware,
                actionVerbTemplate: jc.actionVerbTemplate,
                isNonCompetency: jc.isNonCompetency,
                isCustom: false,
              });
            });
          });

          res.nonCompetencyCards?.forEach((nc) => {
            loadedCards.push({
              id: nc.id,
              title: nc.title,
              cpElementId: null,
              cpCode: "NON-CP",
              cpTitle: "Bantuan Operasional Umum (Non-Jurusan)",
              skkniUnitCode: nc.skkniUnitCode,
              toolsAndSoftware: nc.toolsAndSoftware,
              actionVerbTemplate: nc.actionVerbTemplate,
              isNonCompetency: true,
              isCustom: false,
            });
          });

          if (loadedCards.length > 0) {
            setJobCardsList(loadedCards);
          }
        }
      } catch (err) {
        console.warn("Gagal memuat katalog live dari DB, menggunakan data standar SKKNI:", err);
        if (isCurrent) {
          setJobCardsList(getFallbackCardsBySector(effectiveSector));
        }
      } finally {
        if (isCurrent) setIsLoadingCatalog(false);
      }
    }

    if (isOpen) {
      loadCatalog();
    }

    return () => {
      isCurrent = false;
    };
  }, [isOpen, schoolId, departmentId, token]);

  // Filtered Cards untuk Tab Katalog
  const filteredCards = useMemo(() => {
    return jobCardsList.filter((card) => {
      if (selectedCpFilter !== "ALL") {
        if (selectedCpFilter === "NON_COMPETENCY" && !card.isNonCompetency) return false;
        if (
          selectedCpFilter !== "NON_COMPETENCY" &&
          card.cpElementId !== selectedCpFilter &&
          card.cpCode !== selectedCpFilter
        ) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = card.title.toLowerCase().includes(q);
        const matchSkkni = card.skkniUnitCode?.toLowerCase().includes(q);
        const matchTools = card.toolsAndSoftware?.some((t) => t.toLowerCase().includes(q));
        const matchCp = card.cpTitle?.toLowerCase().includes(q);
        if (!matchTitle && !matchSkkni && !matchTools && !matchCp) return false;
      }

      return true;
    });
  }, [jobCardsList, selectedCpFilter, searchQuery]);

  // Live Tools Preview
  const parsedTools = useMemo(() => {
    return toolsInput
      .split(/[,;\n]+/)
      .map((t) => t.trim())
      .filter(Boolean);
  }, [toolsInput]);

  // Handle Form Submit
  const handleCreateJobCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      setErrorMessage("Judul Kartu Pekerjaan minimal 3 karakter.");
      return;
    }
    if (trimmedTitle.length > 60) {
      setErrorMessage("Judul Kartu Pekerjaan maksimal 60 karakter agar pas di layar HP siswa.");
      return;
    }

    if (!isNonCompetency && !selectedCpId) {
      setErrorMessage("Silakan pilih Elemen Capaian Pembelajaran (CP) induk.");
      return;
    }

    setIsSubmitting(true);

    const autoSkkni = !isNonCompetency
      ? skkniUnitCode.trim() || activeCpSuggestions[0]?.code || sectorGuide.skkniExample.replace("Misal: ", "")
      : null;

    const autoTools = parsedTools.length > 0 ? parsedTools : sectorGuide.suggestedTools.slice(0, 3);

    const payload = {
      cpElementId: isNonCompetency ? null : selectedCpId || null,
      title: trimmedTitle,
      skkniUnitCode: autoSkkni,
      toolsAndSoftware: autoTools,
      actionVerbTemplate:
        actionVerbTemplate.trim() ||
        (sectorGuide.narrationExample
          ? sectorGuide.narrationExample.replace("Contoh: ", "")
          : `Melaksanakan tugas ${trimmedTitle} menggunakan {tool} selama {duration} JP`),
      isNonCompetency,
    };

    try {
      let createdId = `custom-jc-${Date.now()}`;
      if (schoolId && departmentId && token) {
        try {
          const res = await addJobCard(schoolId, departmentId, payload, token);
          if (res?.data?.id) {
            createdId = res.data.id;
          }
        } catch (apiErr: any) {
          console.warn("API addJobCard error, persisting to local catalog state:", apiErr);
          if (apiErr.message?.includes("dikunci")) {
            throw apiErr;
          }
        }
      }

      const matchingCp = cpElements.find((el) => el.id === selectedCpId);

      const newDisplayCard: JobCardDisplayItem = {
        id: createdId,
        title: trimmedTitle,
        cpElementId: isNonCompetency ? null : selectedCpId,
        cpCode: isNonCompetency ? "NON-CP" : matchingCp?.code || "CP-BARU",
        cpTitle: isNonCompetency ? "Bantuan Operasional Kantor / DUDI" : matchingCp?.title || "Elemen CP",
        skkniUnitCode: payload.skkniUnitCode,
        toolsAndSoftware: payload.toolsAndSoftware,
        actionVerbTemplate: payload.actionVerbTemplate,
        isNonCompetency,
        isCustom: true,
      };

      setJobCardsList((prev) => [newDisplayCard, ...prev]);
      setSuccessMessage(`Kartu pekerjaan "${trimmedTitle}" berhasil ditambahkan.`);
      onJobCardCreated?.(newDisplayCard);

      // Reset form
      setTitle("");
      setSkkniUnitCode("");
      setToolsInput("");
      setActionVerbTemplate("");
      setIsNonCompetency(false);

      // Beralih ke tab katalog setelah 1 detik
      setTimeout(() => {
        setActiveTab("catalog");
        setSuccessMessage(null);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menambahkan Job Card. Periksa kembali isian form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-0 duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* ─── 1. Header Dialog (Kompak & Bersih) ─── */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
                  Katalog &amp; Tambah Job Card
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-200/70 shrink-0">
                  {sectorCode} Fase F
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal truncate mt-0.5">
                Sinkronisasi tugas DUDI dengan Elemen Capaian Pembelajaran (CP)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shrink-0"
            aria-label="Tutup Dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── 2. Segmented Pill Tabs Switcher (Rapi & Seimbang) ─── */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50/70 border-b border-slate-200/70 shrink-0 flex items-center justify-between gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 bg-slate-200/60 p-1 rounded-full text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("catalog")}
              className={cn(
                "h-9 px-3.5 sm:px-4 rounded-full transition-all cursor-pointer flex items-center gap-1.5 active:scale-95",
                activeTab === "catalog"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-600" />
              <span>Katalog Kartu Jurusan</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold tabular-nums ml-0.5">
                {jobCardsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={cn(
                "h-9 px-3.5 sm:px-4 rounded-full transition-all cursor-pointer flex items-center gap-1.5 active:scale-95",
                activeTab === "create"
                  ? "bg-sky-500 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Job Card Baru</span>
            </button>
          </div>

          {/* Department badge indikator */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/70 text-[11px] font-semibold text-slate-600 shadow-2xs">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate max-w-[200px]">
              {effectiveSector === "AKL" && (!departmentName || departmentName.includes("Perangkat Lunak"))
                ? "Akuntansi & Keuangan (AKL)"
                : effectiveSector === "OTOMOTIF" && (!departmentName || departmentName.includes("Perangkat Lunak"))
                ? "Teknik Otomotif / TKR"
                : effectiveSector === "DKV" && (!departmentName || departmentName.includes("Perangkat Lunak"))
                ? "Desain Komunikasi Visual"
                : effectiveSector === "KULINER" && (!departmentName || departmentName.includes("Perangkat Lunak"))
                ? "Kuliner / Tata Boga"
                : effectiveSector === "FARMASI" && (!departmentName || departmentName.includes("Perangkat Lunak"))
                ? "Farmasi Klinis"
                : departmentName}
            </span>
          </div>
        </div>

        {/* ─── 3. Content Body (Scrollable) ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
          {/* TAB 1: KATALOG KARTU PEKERJAAN */}
          {activeTab === "catalog" && (
            <div className="space-y-3 animate-in fade-in-0 duration-150">
              {/* Search & Filter Bar Kompak & Proporsional */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1 min-w-0 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari pekerjaan, SKKNI, atau alat..."
                    style={{ paddingLeft: "42px", paddingRight: searchQuery ? "38px" : "14px" }}
                    className="w-full h-10 rounded-xl border border-slate-200/90 bg-slate-50/60 focus:bg-white text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 shadow-2xs transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="w-6 h-6 rounded-full bg-slate-200/80 hover:bg-slate-300 active:scale-90 text-slate-600 flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 transition cursor-pointer z-10"
                      title="Hapus pencarian"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  )}
                </div>

                {/* Dropdown Filter Elemen CP dengan Ukuran Proporsional */}
                <div className="relative w-full sm:w-64 md:w-72 shrink-0">
                  <select
                    value={selectedCpFilter}
                    onChange={(e) => setSelectedCpFilter(e.target.value)}
                    style={{ paddingLeft: "14px", paddingRight: "36px" }}
                    className="w-full h-10 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50/60 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 shadow-2xs cursor-pointer appearance-none truncate text-xs sm:text-[12.5px] font-semibold text-slate-700 transition-all"
                  >
                    <option value="ALL">Semua Elemen CP ({jobCardsList.length})</option>
                    {cpElements.map((cp) => (
                      <option key={cp.id} value={cp.id}>
                        {cp.code}: {cp.title.slice(0, 36)}...
                      </option>
                    ))}
                    <option value="NON_COMPETENCY">Bantuan Operasional / Non-CP</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Status Header: Count Info */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-0.5">
                <span className="font-medium text-[11.5px]">
                  Menampilkan <strong className="text-slate-800 font-bold">{filteredCards.length}</strong> kartu pekerjaan
                </span>
                {selectedCpFilter !== "ALL" && (
                  <button
                    type="button"
                    onClick={() => setSelectedCpFilter("ALL")}
                    className="text-[11px] text-sky-600 hover:underline font-semibold cursor-pointer"
                  >
                    Tampilkan Semua
                  </button>
                )}
              </div>

              {/* List Cards — Desain Bersih, Rapi & Ramping (Apple / Linear Style) */}
              <div className="space-y-2.5">
                {isLoadingCatalog ? (
                  <div className="py-14 text-center space-y-2">
                    <div className="w-7 h-7 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">Memuat katalog kurikulum...</p>
                  </div>
                ) : filteredCards.length === 0 ? (
                  <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 space-y-2.5">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-slate-700">Kartu pekerjaan tidak ditemukan</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tidak ada kartu yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCpFilter("ALL");
                      }}
                      className="h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-semibold transition cursor-pointer"
                    >
                      Reset Pencarian
                    </button>
                  </div>
                ) : (
                  filteredCards.map((card) => (
                    <div
                      key={card.id}
                      className={cn(
                        "p-4 rounded-2xl border transition-all duration-150 flex flex-col justify-between gap-2.5 group",
                        card.isNonCompetency
                          ? "bg-amber-50/20 border-amber-200/70 hover:bg-amber-50/35"
                          : card.isCustom
                          ? "bg-sky-50/20 border-sky-200/80 hover:bg-sky-50/40"
                          : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs"
                      )}
                    >
                      {/* Top Row: CP Badge & SKKNI Code Badge */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wide",
                              card.isNonCompetency
                                ? "bg-amber-100/80 text-amber-800 border-amber-200"
                                : "bg-sky-50 text-sky-700 border-sky-200/80"
                            )}
                          >
                            {card.cpCode || (card.isNonCompetency ? "NON-CP" : "KOMPETENSI")}
                          </span>

                          {card.skkniUnitCode && (
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/70">
                              {card.skkniUnitCode}
                            </span>
                          )}

                          {card.isCustom && (
                            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Kustom Guru</span>
                            </span>
                          )}
                        </div>

                        {card.isNonCompetency && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                            Non-Kejuruan
                          </span>
                        )}
                      </div>

                      {/* Middle: Title & Subtle CP Context */}
                      <div className="space-y-0.5">
                        <h3 className="text-xs sm:text-[13.5px] font-bold text-slate-900 group-hover:text-sky-600 transition-colors leading-snug">
                          {card.title}
                        </h3>
                        {card.cpTitle && !card.isNonCompetency && (
                          <p className="text-[11px] text-slate-400 font-normal truncate">
                            {card.cpTitle}
                          </p>
                        )}
                      </div>

                      {/* Bottom Row: Tools Pills & Action Verb Note */}
                      <div className="pt-1 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        {/* Tools list */}
                        {card.toolsAndSoftware && card.toolsAndSoftware.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Wrench className="w-3 h-3 text-slate-400 shrink-0" />
                            {card.toolsAndSoftware.map((tool, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/70"
                              >
                                {tool}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10.5px] text-slate-400 italic">Standar kurikulum</span>
                        )}

                        {/* Action Verb Tooltip / Compact Footnote */}
                        {card.actionVerbTemplate && (
                          <span
                            className="text-[10.5px] text-slate-400 italic truncate max-w-xs font-normal"
                            title={`Formula CV: "${card.actionVerbTemplate}"`}
                          >
                            &ldquo;{card.actionVerbTemplate}&rdquo;
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FORM TAMBAH JOB CARD BARU (Super Ringkas, Bersih & Full Otomatis) */}
          {activeTab === "create" && (
            <form onSubmit={handleCreateJobCard} className="space-y-4 animate-in fade-in-0 duration-150">
              {/* Petunjuk Singkat Ramah Guru */}
              <div className="p-3 rounded-2xl bg-sky-50/90 border border-sky-100 text-sky-900 text-xs flex items-center gap-2.5 shadow-2xs">
                <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                <p className="text-[11.5px] text-sky-800 font-normal leading-relaxed">
                  Cukup tulis <strong>Nama Pekerjaan</strong> dan pilih <strong>Elemen CP</strong>. Standar kode SKKNI dan formulasi portofolio CV siswa otomatis diproses penuh oleh VokaLink.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-bold leading-relaxed">{successMessage}</span>
                </div>
              )}

              {/* 1. Nama / Judul Pekerjaan */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <span>Nama / Judul Kartu Pekerjaan</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={cn(
                      "text-[10.5px] font-semibold tabular-nums",
                      title.length > 55
                        ? "text-rose-600 font-bold"
                        : title.length > 40
                        ? "text-amber-600"
                        : "text-slate-400"
                    )}
                  >
                    {title.length} / 60 Karakter
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={60}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={sectorGuide.titleExample}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 bg-slate-50/50"
                />
                <p className="text-[10.5px] text-slate-400 font-normal leading-relaxed">
                  Gunakan kalimat kerja operasional ringkas agar mudah dibaca siswa di tempat PKL.
                </p>
              </div>

              {/* 2. Elemen CP Induk & Toggle Non-Kompetensi */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isNonCompetency}
                    onChange={(e) => setIsNonCompetency(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Ini adalah tugas operasional umum (Non-Kejuruan)
                  </span>
                </label>

                {!isNonCompetency ? (
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>Elemen Capaian Pembelajaran (CP) Induk</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCpId}
                        onChange={(e) => setSelectedCpId(e.target.value)}
                        className="w-full h-10 pl-3.5 pr-8 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:border-sky-500 cursor-pointer appearance-none shadow-2xs"
                      >
                        {cpElements.map((cp) => (
                          <option key={cp.id} value={cp.id}>
                            {cp.code}: {cp.title} ({cp.targetJp} JP)
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200/60 font-medium leading-relaxed">
                    Kartu operasional non-jurusan akan dipantau oleh algoritma deteksi drift (toleransi batas maks 20% jam kerja).
                  </p>
                )}
              </div>

              {/* 3. Software / Alat Kerja (Opsional, Simpel & Cepat) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Software / Alat Kerja yang Digunakan <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <div className="relative">
                  <Wrench className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <input
                    type="text"
                    value={toolsInput}
                    onChange={(e) => setToolsInput(e.target.value)}
                    placeholder={sectorGuide.toolsExample}
                    style={{ paddingLeft: "42px", paddingRight: "14px" }}
                    className="w-full h-10 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 bg-slate-50/50 transition-all"
                  />
                </div>
                <p className="text-[10.5px] text-slate-400 font-normal">
                  Pisahkan dengan tanda koma jika lebih dari satu (misal: {sectorGuide.toolsExample.replace("Misal: ", "")}).
                </p>
              </div>

              {/* 4. Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("catalog")}
                  className="h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || title.trim().length < 3}
                  className="h-10 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Simpan ke Katalog</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

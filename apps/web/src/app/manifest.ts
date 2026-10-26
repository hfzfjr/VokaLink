import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VokaLink — Logbook PKL SMK Mandiri & Paspor Kompetensi",
    short_name: "VokaLink",
    description:
      "Platform PWA offline-first untuk pencatatan logbook PKL SMK zero-typing, bukti WebP terkompresi, verifikasi tanpa akun, dan portofolio CV ATS resmi.",
    start_url: "/student/home",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0ea5e9",
    orientation: "portrait",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icons/favicon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/favicon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Catat Jurnal Harian",
        url: "/student/log/new",
        description: "Catat kartu tugas PKL tanpa ketik bebas",
      },
      {
        name: "CV ATS & Paspor",
        url: "/student/career-cv",
        description: "Lihat portofolio kompetensi dan paspor ber-QR",
      },
      {
        name: "Riwayat Logbook",
        url: "/student/log/history",
        description: "Daftar jurnal dan status verifikasi mentor",
      },
    ],
  };
}

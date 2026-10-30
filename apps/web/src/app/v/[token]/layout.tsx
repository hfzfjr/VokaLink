import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://vokalink.vercel.app"),
  title: "Verifikasi Jurnal PKL Siswa — VokaLink",
  description:
    "Pengesahan resmi jurnal kegiatan Praktik Kerja Lapangan (PKL) siswa SMK oleh mentor industri secara digital dan aman.",
  openGraph: {
    title: "Verifikasi Jurnal PKL Siswa — VokaLink",
    description:
      "Pengesahan resmi jurnal kegiatan Praktik Kerja Lapangan (PKL) siswa SMK oleh mentor industri secara digital dan aman.",
    siteName: "VokaLink",
    locale: "id_ID",
    type: "website",
    // Square 1:1 image placed first so WhatsApp displays the clean left-hand logo thumbnail
    images: [
      {
        url: "https://vokalink.vercel.app/icon.png",
        width: 512,
        height: 512,
        alt: "Logo VokaLink",
        type: "image/png",
      },
      {
        url: "https://vokalink.vercel.app/apple-icon.png",
        width: 180,
        height: 180,
        alt: "Logo VokaLink",
        type: "image/png",
      },
      {
        url: "https://vokalink.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "VokaLink — Verifikasi Jurnal PKL Siswa",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Verifikasi Jurnal PKL Siswa — VokaLink",
    description:
      "Pengesahan resmi jurnal kegiatan Praktik Kerja Lapangan (PKL) siswa SMK oleh mentor industri.",
    images: ["https://vokalink.vercel.app/icon.png"],
  },
};

export default function MentorVerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

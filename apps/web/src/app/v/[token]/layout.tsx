import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verifikasi Jurnal PKL — VokaLink",
  description:
    "Pengesahan resmi jurnal kegiatan Praktik Kerja Lapangan (PKL) siswa SMK oleh mentor industri secara digital dan aman.",
  openGraph: {
    title: "Verifikasi Jurnal PKL Siswa — VokaLink",
    description:
      "Pengesahan resmi jurnal kegiatan Praktik Kerja Lapangan (PKL) siswa SMK oleh mentor industri secara digital dan aman.",
    siteName: "VokaLink",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VokaLink — Verifikasi Jurnal PKL Siswa",
        type: "image/png",
      },
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "VokaLink HD Icon",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Verifikasi Jurnal PKL Siswa — VokaLink",
    description:
      "Pengesahan resmi jurnal kegiatan Praktik Kerja Lapangan (PKL) siswa SMK oleh mentor industri.",
    images: ["/og-image.png"],
  },
};

export default function MentorVerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


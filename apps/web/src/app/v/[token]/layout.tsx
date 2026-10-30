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
    images: [
      {
        url: "https://vokalink.vercel.app/icon.png",
        width: 512,
        height: 512,
        alt: "Logo VokaLink",
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

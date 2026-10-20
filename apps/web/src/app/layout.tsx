import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VokaLink — Ekosistem PKL SMK Terintegrasi",
  description:
    "Platform PKL SMK multi-tenant offline-first: logbook zero-typing, verifikasi zero-login, heatmap drift, e-Rapor, CV ATS, dan paspor kompetensi publik ber-QR.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

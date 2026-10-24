import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VokaLink — Ekosistem PKL SMK Terintegrasi",
  description:
    "Platform PKL SMK multi-tenant offline-first: logbook kartu tugas bebas-ketik, verifikasi penyelia zero-login, heatmap drift, e-Rapor, dan paspor kompetensi publik ber-QR.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0F2A43",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink-900 antialiased selection:bg-safety-500 selection:text-ink-900">
        {children}
      </body>
    </html>
  );
}

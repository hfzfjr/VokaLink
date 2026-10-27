import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VokaLink — Ekosistem PKL SMK Terintegrasi",
  description:
    "Platform PKL SMK multi-tenant offline-first: logbook kartu tugas bebas-ketik, verifikasi penyelia zero-login, heatmap drift, e-Rapor, dan paspor kompetensi publik ber-QR.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VokaLink",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/vokalink-icon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/icons/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0ea5e9",
};

import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${plusJakartaSans.className}`}>
      <body className={`${plusJakartaSans.className} min-h-screen bg-paper font-sans text-ink-900 antialiased selection:bg-safety-500 selection:text-ink-900`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

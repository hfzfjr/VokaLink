import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const appUrl =
  process.env["NEXT_PUBLIC_APP_URL"] ||
  (process.env["VERCEL_URL"] ? `https://${process.env["VERCEL_URL"]}` : "https://vokalink.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "VokaLink — Ekosistem PKL SMK Terintegrasi",
  description:
    "Platform PKL SMK multi-tenant offline-first: logbook kartu tugas bebas-ketik, verifikasi penyelia zero-login, heatmap drift, e-Rapor, dan paspor kompetensi publik ber-QR.",
  applicationName: "VokaLink",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VokaLink",
  },
  icons: {
    icon: [
      { url: "/icons/vokalink-icon.svg", type: "image/svg+xml" },
      { url: "/vokalink-icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: ["/vokalink-icon.svg"],
  },
  openGraph: {
    title: "VokaLink — Ekosistem PKL SMK Terintegrasi",
    description:
      "Platform PKL SMK multi-tenant offline-first: logbook kartu tugas bebas-ketik, verifikasi zero-login, e-Rapor, dan paspor kompetensi publik ber-QR.",
    url: appUrl,
    siteName: "VokaLink",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VokaLink — Ekosistem PKL SMK Terintegrasi",
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
    title: "VokaLink — Ekosistem PKL SMK Terintegrasi",
    description:
      "Platform PKL SMK multi-tenant offline-first: logbook kartu tugas bebas-ketik, verifikasi penyelia zero-login, dan paspor kompetensi publik ber-QR.",
    images: ["/og-image.png"],
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

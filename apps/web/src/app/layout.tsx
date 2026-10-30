import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

function getMetadataBase(): URL {
  const raw =
    process.env["NEXT_PUBLIC_APP_URL"] ||
    (process.env["VERCEL_URL"] ? `https://${process.env["VERCEL_URL"]}` : "https://vokalink.vercel.app");
  const normalized = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  try {
    return new URL(normalized);
  } catch {
    return new URL("https://vokalink.vercel.app");
  }
}

const metadataBaseUrl = getMetadataBase();

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl,
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
      { url: "/icons/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/vokalink-icon.svg"],
  },
  openGraph: {
    title: "VokaLink — Ekosistem PKL SMK Terintegrasi",
    description:
      "Platform PKL SMK multi-tenant offline-first: logbook kartu tugas bebas-ketik, verifikasi zero-login, e-Rapor, dan paspor kompetensi publik ber-QR.",
    url: metadataBaseUrl.toString(),
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
    title: "VokaLink — Ekosistem PKL SMK Terintegrasi",
    description:
      "Platform PKL SMK multi-tenant offline-first: logbook kartu tugas bebas-ketik, verifikasi penyelia zero-login, dan paspor kompetensi publik ber-QR.",
    images: ["https://vokalink.vercel.app/icon.png"],
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
      <body className={`${plusJakartaSans.className} min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-sky-500 selection:text-white`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

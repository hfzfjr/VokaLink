"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { SkeletonRect } from "./Skeleton";

interface QrCodeViewProps {
  value: string;
  size?: number;
  className?: string;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  centerLogo?: string | boolean;
  logoSize?: number;
}

/**
 * Komponen QR Code Dinamis & Asli (FR-012 & TC-010)
 * Menghasilkan SVG QR matriks murni yang dapat dipindai oleh kamera HP tanpa koneksi internet.
 * Mendukung center logo vector VokaLink resmi dengan koreksi kesalahan tinggi (H / 30%).
 */
export function QrCodeView({
  value,
  size = 160,
  className = "",
  errorCorrectionLevel = "H",
  centerLogo = "/icons/vokalink-icon.svg",
  logoSize,
}: QrCodeViewProps) {
  const [svgHtml, setSvgHtml] = useState<string>("");

  // Gunakan level 'H' jika ada center logo agar redundansi data QR mencapai 30%
  const effectiveEcLevel = centerLogo ? "H" : errorCorrectionLevel;
  const computedLogoSize = logoSize || Math.round(size * 0.24);

  useEffect(() => {
    let isMounted = true;
    if (!value) return;

    QRCode.toString(value, {
      type: "svg",
      margin: 2,
      width: size,
      errorCorrectionLevel: effectiveEcLevel,
      color: {
        dark: "#0f172a", // slate-900
        light: "#ffffff",
      },
    })
      .then((svg) => {
        if (isMounted) setSvgHtml(svg);
      })
      .catch((err) => {
        console.error("Gagal membangkitkan QR Code SVG:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size, effectiveEcLevel]);

  if (!svgHtml) {
    return (
      <SkeletonRect
        className={`rounded-lg flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-[10px] text-slate-400">Loading QR...</span>
      </SkeletonRect>
    );
  }

  const logoSrc = typeof centerLogo === "string" ? centerLogo : "/icons/vokalink-icon.svg";

  return (
    <div className={`relative inline-block overflow-hidden ${className}`}>
      <div dangerouslySetInnerHTML={{ __html: svgHtml }} />
      {Boolean(centerLogo) && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-1 shadow-md border border-slate-200/90 flex items-center justify-center pointer-events-none"
          style={{ width: computedLogoSize, height: computedLogoSize }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt="VokaLink"
            className="w-full h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { SkeletonRect } from "./Skeleton";

interface QrCodeViewProps {
  value: string;
  size?: number;
  className?: string;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

/**
 * Komponen QR Code Dinamis & Asli (FR-012 & TC-010)
 * Menghasilkan SVG QR matriks murni yang dapat dipindai oleh kamera HP tanpa koneksi internet.
 */
export function QrCodeView({
  value,
  size = 160,
  className = "",
  errorCorrectionLevel = "M",
}: QrCodeViewProps) {
  const [svgHtml, setSvgHtml] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    if (!value) return;

    QRCode.toString(value, {
      type: "svg",
      margin: 2,
      width: size,
      errorCorrectionLevel,
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
  }, [value, size, errorCorrectionLevel]);

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

  return (
    <div
      className={`inline-block overflow-hidden ${className}`}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}

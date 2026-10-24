"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  QrCode,
  X,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Share2,
  ExternalLink,
} from "lucide-react";

interface MentorQrModalProps {
  onClose: () => void;
}

export function MentorQrModal({ onClose }: MentorQrModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleCopyValidationLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("https://vokalink.id/v/andi-pratama-rpl-2026");
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mentor-qr-title"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200/70 shadow-modal space-y-4 animate-in zoom-in-95 duration-150 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 id="mentor-qr-title" className="text-sm font-semibold text-slate-900">
                Minta Validasi Mentor
              </h3>
              <p className="text-[10px] text-slate-500 font-normal">Verifikasi 1-Click Tanpa Akun</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal QR"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Illustration & Scanner Frame */}
        <div className="py-1 flex flex-col items-center">
          <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col items-center justify-center relative group">
            <div className="w-44 h-44 bg-white rounded-xl flex flex-col items-center justify-center border border-slate-200/70 relative overflow-hidden shadow-2xs">
              <div className="grid grid-cols-6 gap-1 p-3 w-full h-full opacity-90">
                {Array.from({ length: 36 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xs ${
                      idx % 2 === 0 || idx % 7 === 0 || idx < 7 || idx > 28
                        ? "bg-slate-900"
                        : "bg-slate-100"
                    }`}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-xl bg-sky-500 text-white font-bold text-base flex items-center justify-center shadow-xs border-2 border-white">
                  V
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-slate-500 text-[11px] font-normal">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Mentor scan via kamera HP · PIN 6-digit (BR-007)</span>
          </div>
        </div>

        {/* Validation Link Box */}
        <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/60 text-left flex items-center justify-between gap-2">
          <div className="truncate text-[11px] font-mono text-slate-600">
            https://vokalink.id/v/andi-pratama...
          </div>
          <button
            type="button"
            onClick={handleCopyValidationLink}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200/70 text-[10px] font-semibold text-slate-800 hover:bg-slate-50 flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-2xs"
          >
            {copiedLink ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-500" />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <a
            href="https://wa.me/?text=Halo%20Bapak%2FIbu%20Mentor%2C%20mohon%20verifikasi%20logbook%20PKL%20VokaLink%20saya%20melalui%20tautan%20ini%3A%20https%3A%2F%2Fvokalink.id%2Fv%2Fandi-pratama-rpl-2026"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Kirim Tautan via WhatsApp</span>
          </a>

          <Link
            href="/student/log/history"
            onClick={onClose}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 border border-slate-200/70 font-semibold text-xs flex items-center justify-center gap-1 transition"
          >
            <span>Buka Riwayat & Status Jurnal</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

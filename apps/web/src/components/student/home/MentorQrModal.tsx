"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close on Escape key press & lock body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  const handleCopyValidationLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("https://vokalink.id/v/andi-pratama-rpl-2026");
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (!isMounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mentor-qr-title"
      className="fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-0 duration-150"
      style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
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
              <p className="text-xs text-slate-500 font-normal">Pindai QR atau kirim via WhatsApp</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog QR"
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer active:scale-95"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mock QR Canvas Card */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center">
          <div className="w-44 h-44 bg-white rounded-xl border border-slate-200 p-2.5 flex items-center justify-center shadow-xs">
            <svg
              className="w-full h-full text-slate-900"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              <rect x="0" y="0" width="30" height="30" rx="4" />
              <rect x="5" y="5" width="20" height="20" rx="2" fill="white" />
              <rect x="10" y="10" width="10" height="10" />

              <rect x="70" y="0" width="30" height="30" rx="4" />
              <rect x="75" y="5" width="20" height="20" rx="2" fill="white" />
              <rect x="80" y="10" width="10" height="10" />

              <rect x="0" y="70" width="30" height="30" rx="4" />
              <rect x="5" y="75" width="20" height="20" rx="2" fill="white" />
              <rect x="10" y="80" width="10" height="10" />

              <rect x="40" y="10" width="20" height="10" />
              <rect x="40" y="30" width="10" height="20" />
              <rect x="60" y="40" width="30" height="10" />
              <rect x="40" y="60" width="20" height="10" />
              <rect x="70" y="60" width="10" height="30" />
              <rect x="40" y="80" width="20" height="10" />
            </svg>
          </div>
          <span className="text-[11px] text-slate-400 mt-2.5 font-mono">
            Token: vkl-auth-382947 (Berlaku 24 jam)
          </span>
        </div>

        {/* One-click Copy Link */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/70 text-xs">
          <input
            type="text"
            readOnly
            value="https://vokalink.id/v/andi-pratama-rpl-2026"
            className="flex-1 bg-transparent px-2 text-slate-600 font-mono text-[11px] outline-none truncate"
          />
          <button
            type="button"
            onClick={handleCopyValidationLink}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200/80 flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer shrink-0"
          >
            {copiedLink ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>

        {/* WhatsApp Hand-off Button */}
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
    </div>,
    document.body
  );
}
